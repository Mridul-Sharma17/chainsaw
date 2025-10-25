import { expect } from "chai";
import { ethers } from "hardhat";
import { SplitChain } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SplitChain - Step 1: Groups", function () {
  let splitChain: SplitChain;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let addr3: HardhatEthersSigner;

  before(async () => {
    // Get signers
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy contract
    const splitChainFactory = await ethers.getContractFactory("SplitChain");
    splitChain = (await splitChainFactory.deploy()) as SplitChain;
    await splitChain.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with groupCount = 0", async function () {
      expect(await splitChain.groupCount()).to.equal(0);
    });
  });

  describe("Create Group", function () {
    it("Should create a group with only creator", async function () {
      const tx = await splitChain.createGroup(
        "Solo Group",
        "Just me",
        [] // No additional members
      );

      await tx.wait();

      expect(await splitChain.groupCount()).to.equal(1);

      const group = await splitChain.getGroup(1);
      expect(group.name).to.equal("Solo Group");
      expect(group.description).to.equal("Just me");
      expect(group.creator).to.equal(owner.address);
      expect(group.active).to.equal(true);
      expect(group.members.length).to.equal(1);
      expect(group.members[0]).to.equal(owner.address);
    });

    it("Should create a group with multiple members", async function () {
      const tx = await splitChain.createGroup(
        "Apartment Expenses",
        "Monthly bills",
        [addr1.address, addr2.address]
      );

      await tx.wait();

      expect(await splitChain.groupCount()).to.equal(2);

      const group = await splitChain.getGroup(2);
      expect(group.name).to.equal("Apartment Expenses");
      expect(group.members.length).to.equal(3); // Creator + 2 members
      expect(group.members[0]).to.equal(owner.address); // Creator first
      expect(group.members[1]).to.equal(addr1.address);
      expect(group.members[2]).to.equal(addr2.address);
    });

    it("Should emit GroupCreated event", async function () {
      await expect(
        splitChain.createGroup(
          "Trip Group",
          "Weekend trip",
          [addr1.address]
        )
      )
        .to.emit(splitChain, "GroupCreated")
        .withArgs(
          3, // groupId
          "Trip Group",
          owner.address,
          [owner.address, addr1.address], // members array
          await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1)
        );
    });

    it("Should add creator as member automatically", async function () {
      await splitChain.createGroup("Test", "Test", [addr1.address]);
      
      const groupId = await splitChain.groupCount();
      expect(await splitChain.isMember(groupId, owner.address)).to.equal(true);
    });

    it("Should add all members to the group", async function () {
      await splitChain.createGroup(
        "Multi Member",
        "Test",
        [addr1.address, addr2.address, addr3.address]
      );

      const groupId = await splitChain.groupCount();
      
      expect(await splitChain.isMember(groupId, owner.address)).to.equal(true);
      expect(await splitChain.isMember(groupId, addr1.address)).to.equal(true);
      expect(await splitChain.isMember(groupId, addr2.address)).to.equal(true);
      expect(await splitChain.isMember(groupId, addr3.address)).to.equal(true);
    });

    it("Should reject empty group name", async function () {
      await expect(
        splitChain.createGroup("", "Description", [])
      ).to.be.revertedWith("Group name cannot be empty");
    });

    it("Should skip duplicate members", async function () {
      await splitChain.createGroup(
        "Duplicate Test",
        "Testing duplicates",
        [addr1.address, addr1.address, addr2.address] // addr1 twice
      );

      const groupId = await splitChain.groupCount();
      const group = await splitChain.getGroup(groupId);
      
      // Should have 3 unique members: owner, addr1, addr2
      expect(group.members.length).to.equal(3);
    });

    it("Should skip zero address", async function () {
      await splitChain.createGroup(
        "Zero Address Test",
        "Testing zero address",
        [addr1.address, ethers.ZeroAddress, addr2.address]
      );

      const groupId = await splitChain.groupCount();
      const group = await splitChain.getGroup(groupId);
      
      // Should have 3 members: owner, addr1, addr2 (zero address skipped)
      expect(group.members.length).to.equal(3);
    });
  });

  describe("Get User Groups", function () {
    it("Should track user's groups correctly", async function () {
      // Owner creates a group
      await splitChain.createGroup("Owner Group", "Test", [addr1.address]);
      
      const ownerGroups = await splitChain.getUserGroups(owner.address);
      const addr1Groups = await splitChain.getUserGroups(addr1.address);
      
      // Owner should be in multiple groups now
      expect(ownerGroups.length).to.be.greaterThan(0);
      
      // addr1 should be in multiple groups too
      expect(addr1Groups.length).to.be.greaterThan(0);
    });

    it("Should return empty array for user with no groups", async function () {
      // Use a fresh address that's not in any group
      const [, , , , newAddr] = await ethers.getSigners();
      const groups = await splitChain.getUserGroups(newAddr.address);
      
      expect(groups.length).to.equal(0);
    });

    it("Should add group to all members' lists", async function () {
      // Create a fresh group with specific members
      await splitChain.connect(addr3).createGroup(
        "Addr3 Group",
        "Created by addr3",
        [addr1.address, addr2.address]
      );

      const groupId = await splitChain.groupCount();
      
      const addr3Groups = await splitChain.getUserGroups(addr3.address);
      const addr1Groups = await splitChain.getUserGroups(addr1.address);
      const addr2Groups = await splitChain.getUserGroups(addr2.address);
      
      // All should have the new group
      expect(addr3Groups).to.include(groupId);
      expect(addr1Groups).to.include(groupId);
      expect(addr2Groups).to.include(groupId);
    });
  });

  describe("Get Group", function () {
    it("Should return correct group data", async function () {
      await splitChain.createGroup("Data Test", "Test data", [addr1.address]);
      
      const groupId = await splitChain.groupCount();
      const group = await splitChain.getGroup(groupId);
      
      expect(group.id).to.equal(groupId);
      expect(group.name).to.equal("Data Test");
      expect(group.description).to.equal("Test data");
      expect(group.creator).to.equal(owner.address);
      expect(group.active).to.equal(true);
      expect(group.createdAt).to.be.greaterThan(0);
    });

    it("Should revert for invalid group ID", async function () {
      await expect(
        splitChain.getGroup(9999)
      ).to.be.revertedWith("Invalid group ID");
    });

    it("Should revert for group ID 0", async function () {
      await expect(
        splitChain.getGroup(0)
      ).to.be.revertedWith("Invalid group ID");
    });
  });

  describe("Get Group Members", function () {
    it("Should return all members of a group", async function () {
      await splitChain.createGroup(
        "Members Test",
        "Test",
        [addr1.address, addr2.address]
      );

      const groupId = await splitChain.groupCount();
      const members = await splitChain.getGroupMembers(groupId);

      expect(members.length).to.equal(3);
      expect(members[0]).to.equal(owner.address);
      expect(members[1]).to.equal(addr1.address);
      expect(members[2]).to.equal(addr2.address);
    });
  });

  describe("Is Group Member", function () {
    it("Should correctly identify members", async function () {
      await splitChain.createGroup("Member Check", "Test", [addr1.address]);
      
      const groupId = await splitChain.groupCount();
      
      expect(await splitChain.isGroupMember(groupId, owner.address)).to.equal(true);
      expect(await splitChain.isGroupMember(groupId, addr1.address)).to.equal(true);
      expect(await splitChain.isGroupMember(groupId, addr2.address)).to.equal(false);
    });
  });

  describe("onlyGroupMember Modifier", function () {
    it("Should allow members to call protected functions", async function () {
      // This will be tested more in Step 2 when we add expense functions
      // For now, we can verify the modifier exists by checking isMember
      await splitChain.createGroup("Modifier Test", "Test", [addr1.address]);
      
      const groupId = await splitChain.groupCount();
      expect(await splitChain.isMember(groupId, owner.address)).to.equal(true);
    });
  });

  describe("SplitChain - Step 2: Expenses & Balances", function () {
    let testGroupId: bigint;

    beforeEach(async function () {
      // Create a test group for expense tests
      const tx = await splitChain.createGroup(
        "Expense Test Group",
        "For testing expenses",
        [addr1.address, addr2.address]
      );
      await tx.wait();
      testGroupId = await splitChain.groupCount();
    });

    describe("Add Expense", function () {
      it("Should add an expense successfully", async function () {
        const amount = ethers.parseEther("1.0");
        
        await expect(
          splitChain.addExpense(
            testGroupId,
            amount,
            "Groceries",
            "Food"
          )
        ).to.emit(splitChain, "ExpenseAdded");

        expect(await splitChain.totalExpenses()).to.equal(1);
      });

      it("Should track multiple expenses", async function () {
        const expenseCountBefore = await splitChain.totalExpenses();
        
        await splitChain.addExpense(testGroupId, ethers.parseEther("1.0"), "Groceries", "Food");
        await splitChain.addExpense(testGroupId, ethers.parseEther("2.0"), "Rent", "Housing");
        await splitChain.addExpense(testGroupId, ethers.parseEther("0.5"), "Uber", "Travel");

        const expenseCountAfter = await splitChain.totalExpenses();
        expect(expenseCountAfter - expenseCountBefore).to.equal(3);
        
        const expenses = await splitChain.getGroupExpenses(testGroupId);
        expect(expenses.length).to.equal(3);
      });

      it("Should record correct expense data", async function () {
        const amount = ethers.parseEther("1.5");
        const description = "Dinner at restaurant";
        const category = "Food";

        await splitChain.addExpense(testGroupId, amount, description, category);

        const expenses = await splitChain.getGroupExpenses(testGroupId);
        expect(expenses.length).to.equal(1);
        
        const expense = expenses[0];
        expect(expense.paidBy).to.equal(owner.address);
        expect(expense.amount).to.equal(amount);
        expect(expense.description).to.equal(description);
        expect(expense.category).to.equal(category);
        expect(expense.timestamp).to.be.greaterThan(0);
      });

      it("Should emit ExpenseAdded event with correct parameters", async function () {
        const amount = ethers.parseEther("1.0");
        const description = "Test Expense";
        const category = "Test";

        await expect(
          splitChain.addExpense(testGroupId, amount, description, category)
        )
          .to.emit(splitChain, "ExpenseAdded")
          .withArgs(
            testGroupId,
            0, // First expense, id = 0
            owner.address,
            amount,
            description,
            category,
            await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1)
          );
      });

      it("Should allow any group member to add expense", async function () {
        // addr1 adds expense
        await splitChain.connect(addr1).addExpense(
          testGroupId,
          ethers.parseEther("1.0"),
          "Paid by addr1",
          "Food"
        );

        const expenses = await splitChain.getGroupExpenses(testGroupId);
        expect(expenses[0].paidBy).to.equal(addr1.address);
      });

      it("Should reject expense from non-member", async function () {
        await expect(
          splitChain.connect(addr3).addExpense(
            testGroupId,
            ethers.parseEther("1.0"),
            "Not a member",
            "Food"
          )
        ).to.be.revertedWith("Not a group member");
      });

      it("Should reject zero amount", async function () {
        await expect(
          splitChain.addExpense(testGroupId, 0, "Zero amount", "Food")
        ).to.be.revertedWith("Amount must be greater than 0");
      });

      it("Should reject empty description", async function () {
        await expect(
          splitChain.addExpense(testGroupId, ethers.parseEther("1.0"), "", "Food")
        ).to.be.revertedWith("Description cannot be empty");
      });

      it("Should reject empty category", async function () {
        await expect(
          splitChain.addExpense(testGroupId, ethers.parseEther("1.0"), "Test", "")
        ).to.be.revertedWith("Category cannot be empty");
      });
    });

    describe("Get Group Expenses", function () {
      it("Should return all expenses for a group", async function () {
        await splitChain.addExpense(testGroupId, ethers.parseEther("1.0"), "Expense 1", "Food");
        await splitChain.addExpense(testGroupId, ethers.parseEther("2.0"), "Expense 2", "Travel");

        const expenses = await splitChain.getGroupExpenses(testGroupId);
        expect(expenses.length).to.equal(2);
        expect(expenses[0].description).to.equal("Expense 1");
        expect(expenses[1].description).to.equal("Expense 2");
      });

      it("Should return empty array for group with no expenses", async function () {
        const expenses = await splitChain.getGroupExpenses(testGroupId);
        expect(expenses.length).to.equal(0);
      });

      it("Should revert for invalid group ID", async function () {
        await expect(
          splitChain.getGroupExpenses(9999)
        ).to.be.revertedWith("Invalid group ID");
      });
    });

    describe("Calculate Group Balances", function () {
      it("Should calculate balances correctly for simple case", async function () {
        // 3 members: owner, addr1, addr2
        // Owner pays 3 ETH
        // Split: 1 ETH each
        // Owner should have +2 ETH balance (paid 3, owes 1)
        // Others should have -1 ETH balance each

        await splitChain.addExpense(
          testGroupId,
          ethers.parseEther("3.0"),
          "Rent",
          "Housing"
        );

        const balances = await splitChain.getGroupBalances(testGroupId);
        
        // Find each member's balance
        const ownerBalance = balances.find(b => b.member === owner.address);
        const addr1Balance = balances.find(b => b.member === addr1.address);
        const addr2Balance = balances.find(b => b.member === addr2.address);

        expect(ownerBalance!.balance).to.equal(ethers.parseEther("2.0"));
        expect(addr1Balance!.balance).to.equal(ethers.parseEther("-1.0"));
        expect(addr2Balance!.balance).to.equal(ethers.parseEther("-1.0"));
      });

      it("Should calculate balances with multiple expenses", async function () {
        // Owner pays 3 ETH
        await splitChain.addExpense(testGroupId, ethers.parseEther("3.0"), "Expense 1", "Food");
        
        // addr1 pays 3 ETH
        await splitChain.connect(addr1).addExpense(
          testGroupId,
          ethers.parseEther("3.0"),
          "Expense 2",
          "Travel"
        );

        const balances = await splitChain.getGroupBalances(testGroupId);
        
        // Total: 6 ETH, split 3 ways = 2 ETH each
        // Owner: paid 3, owes 2 = +1 balance
        // addr1: paid 3, owes 2 = +1 balance
        // addr2: paid 0, owes 2 = -2 balance

        const ownerBalance = balances.find(b => b.member === owner.address);
        const addr1Balance = balances.find(b => b.member === addr1.address);
        const addr2Balance = balances.find(b => b.member === addr2.address);

        expect(ownerBalance!.balance).to.equal(ethers.parseEther("1.0"));
        expect(addr1Balance!.balance).to.equal(ethers.parseEther("1.0"));
        expect(addr2Balance!.balance).to.equal(ethers.parseEther("-2.0"));
      });

      it("Should show zero balance when everyone paid equally", async function () {
        // Create a fresh group for this test to avoid interference
        const freshTx = await splitChain.createGroup(
          "Equal Split Test",
          "Testing equal balances",
          [addr1.address, addr2.address]
        );
        await freshTx.wait();
        const freshGroupId = await splitChain.groupCount();

        // Each person pays 3 ETH (amount divisible by 3)
        await splitChain.addExpense(freshGroupId, ethers.parseEther("3.0"), "Owner pays", "Food");
        await splitChain.connect(addr1).addExpense(freshGroupId, ethers.parseEther("3.0"), "Addr1 pays", "Food");
        await splitChain.connect(addr2).addExpense(freshGroupId, ethers.parseEther("3.0"), "Addr2 pays", "Food");

        const balances = await splitChain.getGroupBalances(freshGroupId);
        
        // Everyone paid 3 and owes 3, so all balances should be 0
        balances.forEach(balance => {
          expect(balance.balance).to.equal(0);
        });
      });

      it("Should return empty balances for group with no expenses", async function () {
        const balances = await splitChain.getGroupBalances(testGroupId);
        
        expect(balances.length).to.equal(3); // 3 members
        balances.forEach(balance => {
          expect(balance.balance).to.equal(0);
        });
      });
    });

    describe("Settle Up", function () {
      beforeEach(async function () {
        // Create debt: owner pays 3 ETH, split 3 ways
        // addr1 and addr2 each owe 1 ETH to owner
        await splitChain.addExpense(
          testGroupId,
          ethers.parseEther("3.0"),
          "Create debt",
          "Housing"
        );
      });

      it("Should allow settling debt with ETH transfer", async function () {
        const settlementAmount = ethers.parseEther("1.0");
        
        const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
        
        await expect(
          splitChain.connect(addr1).settleUp(testGroupId, owner.address, {
            value: settlementAmount
          })
        ).to.emit(splitChain, "SettlementMade");

        const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
        expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(settlementAmount);
      });

      it("Should emit SettlementMade event", async function () {
        const settlementAmount = ethers.parseEther("1.0");

        await expect(
          splitChain.connect(addr1).settleUp(testGroupId, owner.address, {
            value: settlementAmount
          })
        )
          .to.emit(splitChain, "SettlementMade")
          .withArgs(
            testGroupId,
            addr1.address,
            owner.address,
            settlementAmount,
            await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1)
          );
      });

      it("Should reject settlement with zero ETH", async function () {
        await expect(
          splitChain.connect(addr1).settleUp(testGroupId, owner.address, {
            value: 0
          })
        ).to.be.revertedWith("Must send ETH to settle");
      });

      it("Should reject settling with yourself", async function () {
        await expect(
          splitChain.settleUp(testGroupId, owner.address, {
            value: ethers.parseEther("1.0")
          })
        ).to.be.revertedWith("Cannot settle with yourself");
      });

      it("Should reject settling with non-member", async function () {
        await expect(
          splitChain.connect(addr1).settleUp(testGroupId, addr3.address, {
            value: ethers.parseEther("1.0")
          })
        ).to.be.revertedWith("Creditor must be a group member");
      });

      it("Should reject settlement from non-member", async function () {
        await expect(
          splitChain.connect(addr3).settleUp(testGroupId, owner.address, {
            value: ethers.parseEther("1.0")
          })
        ).to.be.revertedWith("Not a group member");
      });

      it("Should reject settling with zero address", async function () {
        await expect(
          splitChain.connect(addr1).settleUp(testGroupId, ethers.ZeroAddress, {
            value: ethers.parseEther("1.0")
          })
        ).to.be.revertedWith("Invalid creditor address");
      });
    });

    describe("Get Expense Count", function () {
      it("Should return correct expense count", async function () {
        expect(await splitChain.getGroupExpenseCount(testGroupId)).to.equal(0);

        await splitChain.addExpense(testGroupId, ethers.parseEther("1.0"), "Expense 1", "Food");
        expect(await splitChain.getGroupExpenseCount(testGroupId)).to.equal(1);

        await splitChain.addExpense(testGroupId, ethers.parseEther("2.0"), "Expense 2", "Travel");
        expect(await splitChain.getGroupExpenseCount(testGroupId)).to.equal(2);
      });
    });
  });
});
