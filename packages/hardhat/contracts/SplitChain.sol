// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SplitChain
 * @notice Decentralized expense splitting with automatic balance calculation
 * @dev Groups can track expenses and settle debts transparently on-chain
 */
contract SplitChain {
    // ============ STRUCTS ============

    /**
     * @notice Group structure containing all group information
     */
    struct Group {
        uint256 id;
        string name;
        string description;
        address creator;
        address[] members;
        uint256 createdAt;
        bool active;
    }

    /**
     * @notice Member balance structure for balance calculations
     */
    struct MemberBalance {
        address member;
        int256 balance; // Positive = owed to them, Negative = they owe
    }

    /**
     * @notice Expense structure for tracking individual expenses
     */
    struct Expense {
        uint256 id;
        address paidBy;
        uint256 amount;
        string description;
        string category;
        uint256 timestamp;
        bool isUnevenSplit;
        address[] splitMembers;
        uint256[] splitAmounts;
    }

    // ============ STATE VARIABLES ============

    /// @notice Mapping of group ID to Group
    mapping(uint256 => Group) public groups;

    /// @notice Mapping of group ID to member address to membership status
    mapping(uint256 => mapping(address => bool)) public isMember;

    /// @notice Mapping of user address to array of their group IDs
    mapping(address => uint256[]) private userGroups;

    /// @notice Mapping of group ID to array of expenses
    mapping(uint256 => Expense[]) private groupExpenses;

    /// @notice Total number of groups created
    uint256 public groupCount;

    /// @notice Total number of expenses created across all groups
    uint256 public totalExpenses;

    // ============ EVENTS ============

    /**
     * @notice Emitted when a new group is created
     */
    event GroupCreated(
        uint256 indexed groupId,
        string name,
        address indexed creator,
        address[] members,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a member is added to a group
     */
    event MemberAdded(
        uint256 indexed groupId,
        address indexed member,
        uint256 timestamp
    );

    /**
     * @notice Emitted when an expense is added to a group
     */
    event ExpenseAdded(
        uint256 indexed groupId,
        uint256 indexed expenseId,
        address indexed paidBy,
        uint256 amount,
        string description,
        string category,
        uint256 timestamp,
        bool isUnevenSplit
    );

    /**
     * @notice Emitted when a settlement is made between members
     */
    event SettlementMade(
        uint256 indexed groupId,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );

    // ============ MODIFIERS ============

    /**
     * @notice Ensures caller is a member of the specified group
     */
    modifier onlyGroupMember(uint256 _groupId) {
        require(
            isMember[_groupId][msg.sender],
            "Not a group member"
        );
        _;
    }

    /**
     * @notice Ensures the group is active
     */
    modifier onlyActiveGroup(uint256 _groupId) {
        require(
            groups[_groupId].active,
            "Group is not active"
        );
        _;
    }

    // ============ FUNCTIONS ============

    /**
     * @notice Creates a new expense group
     * @param _name Name of the group
     * @param _description Description of the group purpose
     * @param _members Array of member addresses (excluding creator)
     * @return groupId The ID of the newly created group
     */
    function createGroup(
        string memory _name,
        string memory _description,
        address[] memory _members
    ) external returns (uint256) {
        // Input validation
        require(bytes(_name).length > 0, "Group name cannot be empty");
        require(_members.length < 50, "Too many members"); // Gas optimization

        // Increment group counter
        groupCount++;
        uint256 newGroupId = groupCount;

        // Create new group in storage
        Group storage newGroup = groups[newGroupId];
        newGroup.id = newGroupId;
        newGroup.name = _name;
        newGroup.description = _description;
        newGroup.creator = msg.sender;
        newGroup.createdAt = block.timestamp;
        newGroup.active = true;

        // Add creator as first member
        newGroup.members.push(msg.sender);
        isMember[newGroupId][msg.sender] = true;
        userGroups[msg.sender].push(newGroupId);

        // Add other members
        for (uint256 i = 0; i < _members.length; i++) {
            address member = _members[i];
            
            // Skip if address is zero or already a member
            if (member == address(0) || isMember[newGroupId][member]) {
                continue;
            }

            newGroup.members.push(member);
            isMember[newGroupId][member] = true;
            userGroups[member].push(newGroupId);

            emit MemberAdded(newGroupId, member, block.timestamp);
        }

        emit GroupCreated(
            newGroupId,
            _name,
            msg.sender,
            newGroup.members,
            block.timestamp
        );

        return newGroupId;
    }

    /**
     * @notice Gets full details of a group
     * @param _groupId The ID of the group
     * @return The Group struct with all information
     */
    function getGroup(uint256 _groupId) 
        external 
        view 
        returns (Group memory) 
    {
        require(_groupId > 0 && _groupId <= groupCount, "Invalid group ID");
        return groups[_groupId];
    }

    /**
     * @notice Gets all group IDs that a user belongs to
     * @param _user The address of the user
     * @return Array of group IDs
     */
    function getUserGroups(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userGroups[_user];
    }

    /**
     * @notice Gets the members of a group
     * @param _groupId The ID of the group
     * @return Array of member addresses
     */
    function getGroupMembers(uint256 _groupId)
        external
        view
        returns (address[] memory)
    {
        require(_groupId > 0 && _groupId <= groupCount, "Invalid group ID");
        return groups[_groupId].members;
    }

    /**
     * @notice Checks if an address is a member of a group
     * @param _groupId The ID of the group
     * @param _user The address to check
     * @return True if user is a member, false otherwise
     */
    function isGroupMember(uint256 _groupId, address _user)
        external
        view
        returns (bool)
    {
        return isMember[_groupId][_user];
    }

    // ============ EXPENSE FUNCTIONS ============

    /**
     * @notice Adds an expense to a group
     * @param _groupId The ID of the group
     * @param _amount The amount of the expense in wei
     * @param _description Description of the expense
     * @param _category Category of the expense (e.g., Food, Travel, Housing)
     */
    function addExpense(
        uint256 _groupId,
        uint256 _amount,
        string memory _description,
        string memory _category
    ) 
        external 
        onlyGroupMember(_groupId)
        onlyActiveGroup(_groupId)
    {
        // Input validation
        require(_amount > 0, "Amount must be greater than 0");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_category).length > 0, "Category cannot be empty");

        // Increment total expenses counter
        totalExpenses++;

        // Create new expense with empty arrays for even split
        Expense memory newExpense = Expense({
            id: groupExpenses[_groupId].length,
            paidBy: msg.sender,
            amount: _amount,
            description: _description,
            category: _category,
            timestamp: block.timestamp,
            isUnevenSplit: false,
            splitMembers: new address[](0),
            splitAmounts: new uint256[](0)
        });

        // Add to group's expenses
        groupExpenses[_groupId].push(newExpense);

        // Emit event
        emit ExpenseAdded(
            _groupId,
            newExpense.id,
            msg.sender,
            _amount,
            _description,
            _category,
            block.timestamp,
            false
        );
    }

    /**
     * @notice Adds an expense with uneven split to a group
     * @param _groupId The ID of the group
     * @param _amount The total amount of the expense in wei
     * @param _description Description of the expense
     * @param _category Category of the expense
     * @param _splitMembers Array of member addresses for the split
     * @param _splitAmounts Array of amounts corresponding to each member
     */
    function addUnevenExpense(
        uint256 _groupId,
        uint256 _amount,
        string memory _description,
        string memory _category,
        address[] memory _splitMembers,
        uint256[] memory _splitAmounts
    ) 
        external 
        onlyGroupMember(_groupId)
        onlyActiveGroup(_groupId)
    {
        // Input validation
        require(_amount > 0, "Amount must be greater than 0");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_category).length > 0, "Category cannot be empty");
        require(_splitMembers.length > 0, "Must have at least one split member");
        require(_splitMembers.length == _splitAmounts.length, "Members and amounts must match");

        // Verify all split members are actually in the group
        for (uint256 i = 0; i < _splitMembers.length; i++) {
            require(isMember[_groupId][_splitMembers[i]], "All split members must be in group");
            require(_splitAmounts[i] > 0, "Split amounts must be greater than 0");
        }

        // Verify that split amounts sum to total amount
        uint256 totalSplit = 0;
        for (uint256 i = 0; i < _splitAmounts.length; i++) {
            totalSplit += _splitAmounts[i];
        }
        require(totalSplit == _amount, "Split amounts must equal total amount");

        // Increment total expenses counter
        totalExpenses++;

        // Create new expense with uneven split data
        Expense memory newExpense = Expense({
            id: groupExpenses[_groupId].length,
            paidBy: msg.sender,
            amount: _amount,
            description: _description,
            category: _category,
            timestamp: block.timestamp,
            isUnevenSplit: true,
            splitMembers: _splitMembers,
            splitAmounts: _splitAmounts
        });

        // Add to group's expenses
        groupExpenses[_groupId].push(newExpense);

        // Emit event
        emit ExpenseAdded(
            _groupId,
            newExpense.id,
            msg.sender,
            _amount,
            _description,
            _category,
            block.timestamp,
            true
        );
    }

    /**
     * @notice Gets all expenses for a group
     * @param _groupId The ID of the group
     * @return Array of all expenses in the group
     */
    function getGroupExpenses(uint256 _groupId)
        external
        view
        returns (Expense[] memory)
    {
        require(_groupId > 0 && _groupId <= groupCount, "Invalid group ID");
        return groupExpenses[_groupId];
    }

    /**
     * @notice Calculates the net balance for each member of a group
     * @dev Positive balance = member is owed money, Negative = member owes money
     * @param _groupId The ID of the group
     * @return Array of MemberBalance structs with calculated balances
     */
    function getGroupBalances(uint256 _groupId)
        external
        view
        returns (MemberBalance[] memory)
    {
        require(_groupId > 0 && _groupId <= groupCount, "Invalid group ID");
        
        Group storage group = groups[_groupId];
        Expense[] memory expenses = groupExpenses[_groupId];
        
        uint256 memberCount = group.members.length;
        require(memberCount > 0, "Group has no members");

        // Initialize balances array
        MemberBalance[] memory balances = new MemberBalance[](memberCount);
        
        // Initialize each member's balance to 0
        for (uint256 i = 0; i < memberCount; i++) {
            balances[i] = MemberBalance({
                member: group.members[i],
                balance: 0
            });
        }

        // Calculate balances from all expenses
        for (uint256 i = 0; i < expenses.length; i++) {
            Expense memory expense = expenses[i];
            
            if (expense.isUnevenSplit) {
                // Handle uneven split
                // First, credit the payer with the full amount
                for (uint256 j = 0; j < memberCount; j++) {
                    if (group.members[j] == expense.paidBy) {
                        balances[j].balance += int256(expense.amount);
                        break;
                    }
                }
                
                // Then, debit each member their specific split amount
                for (uint256 k = 0; k < expense.splitMembers.length; k++) {
                    address splitMember = expense.splitMembers[k];
                    uint256 splitAmount = expense.splitAmounts[k];
                    
                    // Find this member in balances array and deduct their share
                    for (uint256 j = 0; j < memberCount; j++) {
                        if (group.members[j] == splitMember) {
                            balances[j].balance -= int256(splitAmount);
                            break;
                        }
                    }
                }
            } else {
                // Handle even split (original logic)
                uint256 splitAmount = expense.amount / memberCount;
                
                // Each member owes their split
                for (uint256 j = 0; j < memberCount; j++) {
                    // The payer gets credited (positive balance)
                    if (group.members[j] == expense.paidBy) {
                        balances[j].balance += int256(expense.amount);
                    }
                    // Everyone (including payer) owes their share (negative balance)
                    balances[j].balance -= int256(splitAmount);
                }
            }
        }

        return balances;
    }

    /**
     * @notice Settles a debt between the caller and a creditor
     * @param _groupId The ID of the group
     * @param _creditor The address of the person being paid
     */
    function settleUp(uint256 _groupId, address payable _creditor)
        external
        payable
        onlyGroupMember(_groupId)
        onlyActiveGroup(_groupId)
    {
        // Input validation
        require(msg.value > 0, "Must send ETH to settle");
        require(_creditor != address(0), "Invalid creditor address");
        require(_creditor != msg.sender, "Cannot settle with yourself");
        require(isMember[_groupId][_creditor], "Creditor must be a group member");

        // Transfer ETH to creditor
        (bool success, ) = _creditor.call{value: msg.value}("");
        require(success, "ETH transfer failed");

        // Emit settlement event
        emit SettlementMade(
            _groupId,
            msg.sender,
            _creditor,
            msg.value,
            block.timestamp
        );
    }

    /**
     * @notice Gets the count of expenses in a group
     * @param _groupId The ID of the group
     * @return The number of expenses
     */
    function getGroupExpenseCount(uint256 _groupId)
        external
        view
        returns (uint256)
    {
        require(_groupId > 0 && _groupId <= groupCount, "Invalid group ID");
        return groupExpenses[_groupId].length;
    }
}
