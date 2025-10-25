"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import {
  ArrowLeftIcon,
  PlusCircleIcon,
  UsersIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Address, AddressInput, EtherInput } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const GroupDetail: NextPage = () => {
  const params = useParams();
  const groupId = BigInt(params.id as string);
  const { address: connectedAddress } = useAccount();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  
  // Uneven split states
  const [isUnevenSplit, setIsUnevenSplit] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState<{ [address: string]: string }>({});

  const [showSettleUp, setShowSettleUp] = useState(false);
  const [settlementCreditor, setSettlementCreditor] = useState("");
  const [settlementAmount, setSettlementAmount] = useState("");
  const [isSettling, setIsSettling] = useState(false);

  // Fetch group details
  const { data: group } = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroup",
    args: [groupId],
  });

  // Fetch expenses
  const { data: expenses } = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupExpenses",
    args: [groupId],
  });

  // Fetch balances
  const { data: balances } = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupBalances",
    args: [groupId],
  });

  // Listen to events for real-time updates
  useScaffoldEventHistory({
    contractName: "SplitChain",
    eventName: "ExpenseAdded",
    fromBlock: 0n,
    filters: { groupId },
    watch: true,
  });

  const { data: settlementEvents } = useScaffoldEventHistory({
    contractName: "SplitChain",
    eventName: "SettlementMade",
    fromBlock: 0n,
    filters: { groupId },
    watch: true,
  });

  const { writeContractAsync: writeContract } = useScaffoldWriteContract("SplitChain");

  const handleCopySummary = () => {
    if (!group || !expenses || !balances) return;

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0n);
    const summary = `
📊 ${group.name} - Expense Summary

👥 Members: ${group.members.length}
💰 Total Spent: ${parseFloat(formatEther(totalSpent)).toFixed(4)} ETH
📝 Expenses: ${expenses.length}

💸 Balances:
${balances
  .map(b => {
    const addr = `${b.member.slice(0, 6)}...${b.member.slice(-4)}`;
    if (b.balance > 0n) return `  ${addr}: Gets back ${formatEther(b.balance)} ETH ✅`;
    if (b.balance < 0n) return `  ${addr}: Owes ${formatEther(-b.balance)} ETH ❌`;
    return `  ${addr}: Settled ✨`;
  })
  .join('\n')}

📋 Recent Expenses:
${expenses
  .slice(-5)
  .map(e => `  • ${e.description} - ${formatEther(e.amount)} ETH (${e.category})`)
  .join('\n')}

🔗 Powered by SplitChain
`.trim();

    navigator.clipboard.writeText(summary);
    notification.success("Summary copied to clipboard!");
  };

  const handleAddExpense = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      notification.error("Please enter a valid amount");
      return;
    }

    if (!expenseDescription.trim()) {
      notification.error("Please enter a description");
      return;
    }

    // Validation for uneven split
    if (isUnevenSplit && group) {
      const totalSplit = group.members.reduce((sum, member) => {
        const amount = splitAmounts[member] || "0";
        return sum + parseFloat(amount);
      }, 0);

      if (Math.abs(totalSplit - parseFloat(expenseAmount)) > 0.0001) {
        notification.error(`Split amounts (${totalSplit.toFixed(4)} ETH) must equal total (${expenseAmount} ETH)`);
        return;
      }

      // Check all members have an amount
      const hasEmptyAmounts = group.members.some(member => !splitAmounts[member] || parseFloat(splitAmounts[member]) <= 0);
      if (hasEmptyAmounts) {
        notification.error("Please enter amounts for all members");
        return;
      }
    }

    setIsAddingExpense(true);

    try {
      if (isUnevenSplit && group) {
        // Call addUnevenExpense
        const splitMembers = group.members;
        const splitAmountsArray = splitMembers.map(member => parseEther(splitAmounts[member] || "0"));

        await writeContract({
          functionName: "addUnevenExpense",
          args: [groupId, parseEther(expenseAmount), expenseDescription, expenseCategory, splitMembers, splitAmountsArray],
        });
      } else {
        // Call regular addExpense
        await writeContract({
          functionName: "addExpense",
          args: [groupId, parseEther(expenseAmount), expenseDescription, expenseCategory],
        });
      }

      notification.success("Expense added successfully!");
      setExpenseAmount("");
      setExpenseDescription("");
      setExpenseCategory("Food");
      setIsUnevenSplit(false);
      setSplitAmounts({});
      setShowAddExpense(false);
    } catch (error: any) {
      console.error("Error adding expense:", error);
      notification.error(error?.message || "Failed to add expense");
    } finally {
      setIsAddingExpense(false);
    }
  };

  const handleSettleUp = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!settlementCreditor || settlementCreditor === "") {
      notification.error("Please enter a valid creditor address");
      return;
    }

    if (!settlementAmount || parseFloat(settlementAmount) <= 0) {
      notification.error("Please enter a valid amount");
      return;
    }

    setIsSettling(true);

    try {
      await writeContract({
        functionName: "settleUp",
        args: [groupId, settlementCreditor as `0x${string}`],
        value: parseEther(settlementAmount),
      });

      notification.success("Settlement successful!");
      setSettlementCreditor("");
      setSettlementAmount("");
      setShowSettleUp(false);
    } catch (error: any) {
      console.error("Error settling up:", error);
      notification.error(error?.message || "Failed to settle");
    } finally {
      setIsSettling(false);
    }
  };

  const getBalanceText = (balance: bigint) => {
    if (balance > 0n) return `Gets back ${formatEther(balance)} ETH`;
    if (balance < 0n) return `Owes ${formatEther(-balance)} ETH`;
    return "Settled up";
  };

  if (!group) {
    return (
      <div className="flex items-center flex-col grow pt-10 bg-gray-50 min-h-screen">
        <div className="loading loading-spinner loading-lg text-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center flex-col grow bg-gray-50 min-h-screen py-6">
        <div className="px-5 w-full max-w-6xl">
          <Link href="/" className="btn btn-sm bg-white border-gray-200 hover:bg-gray-50 gap-2 mb-4">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Group Header */}
          <div className="card bg-white shadow-md mb-4 border border-gray-200">
            <div className="card-body p-5">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2 text-gray-900">
                    {group.name}
                  </h1>
                  <p className="text-gray-600 text-sm">{group.description}</p>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">{group.members.length} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BanknotesIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-gray-700">{expenses?.length || 0} expenses</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopySummary}
                    className="btn btn-sm bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 gap-2"
                    disabled={!expenses || expenses.length === 0}
                  >
                    <ShareIcon className="h-4 w-4" />
                    Copy Summary
                  </button>
                  <button
                    onClick={() => setShowAddExpense(!showAddExpense)}
                    className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white border-0 gap-2"
                    disabled={!connectedAddress}
                  >
                    <PlusCircleIcon className="h-4 w-4" />
                    Add Expense
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Dashboard */}
          {expenses && expenses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              {/* Total Spent */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Total Spent</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0n);
                    return parseFloat(formatEther(total)).toFixed(3);
                  })()}
                </div>
                <div className="text-xs text-gray-500 mt-1">ETH</div>
              </div>

              {/* Average Per Person */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Avg Per Person</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0n);
                    const avgWei = total / BigInt(group.members.length);
                    return parseFloat(formatEther(avgWei)).toFixed(3);
                  })()}
                </div>
                <div className="text-xs text-gray-500 mt-1">ETH</div>
              </div>

              {/* Most Expensive Category */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Top Category</div>
                <div className="text-xl font-bold text-gray-900">
                  {(() => {
                    const categoryTotals = expenses.reduce((acc, exp) => {
                      acc[exp.category] = (acc[exp.category] || 0n) + exp.amount;
                      return acc;
                    }, {} as Record<string, bigint>);
                    const topCategory = Object.entries(categoryTotals).sort((a, b) => (a[1] > b[1] ? -1 : 1))[0];
                    return topCategory ? topCategory[0] : "N/A";
                  })()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Highest spending</div>
              </div>

              {/* Settlements Made */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Settlements</div>
                <div className="text-2xl font-bold text-gray-900">{settlementEvents?.length || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Payments made</div>
              </div>
            </div>
          )}

          {/* Add Expense Form */}
          {showAddExpense && (
            <div className="card bg-white shadow-md mb-4 border border-gray-200">
              <div className="card-body p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Add New Expense</h3>
                
                {/* Split Type Toggle */}
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700 text-sm">Split Type</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="splitType"
                        className="radio radio-primary"
                        checked={!isUnevenSplit}
                        onChange={() => {
                          setIsUnevenSplit(false);
                          setSplitAmounts({});
                        }}
                        disabled={isAddingExpense}
                      />
                      <span className="label-text text-gray-700">Even Split</span>
                    </label>
                    <label className="label cursor-pointer gap-2">
                      <input
                        type="radio"
                        name="splitType"
                        className="radio radio-primary"
                        checked={isUnevenSplit}
                        onChange={() => setIsUnevenSplit(true)}
                        disabled={isAddingExpense}
                      />
                      <span className="label-text text-gray-700">Uneven Split ⭐</span>
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-gray-700 text-sm">Total Amount (ETH) *</span>
                    </label>
                    <EtherInput 
                      value={expenseAmount} 
                      onChange={(val) => {
                        setExpenseAmount(val);
                        // Auto-distribute for even split
                        if (!isUnevenSplit && group && val) {
                          const perPerson = (parseFloat(val) / group.members.length).toFixed(4);
                          const newSplits: { [address: string]: string } = {};
                          group.members.forEach(member => {
                            newSplits[member] = perPerson;
                          });
                          setSplitAmounts(newSplits);
                        }
                      }} 
                      placeholder="0.0" 
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-gray-700 text-sm">Category *</span>
                    </label>
                    <select
                      className="select select-bordered bg-white border-gray-300"
                      value={expenseCategory}
                      onChange={e => setExpenseCategory(e.target.value)}
                      disabled={isAddingExpense}
                    >
                      <option value="Food">🍔 Food</option>
                      <option value="Transport">🚗 Transport</option>
                      <option value="Accommodation">🏠 Accommodation</option>
                      <option value="Entertainment">🎬 Entertainment</option>
                      <option value="Shopping">🛍️ Shopping</option>
                      <option value="Utilities">💡 Utilities</option>
                      <option value="Other">📦 Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-700 text-sm">Description *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dinner at restaurant"
                    className="input input-bordered bg-white border-gray-300"
                    value={expenseDescription}
                    onChange={e => setExpenseDescription(e.target.value)}
                    disabled={isAddingExpense}
                  />
                </div>
                
                {/* Uneven Split Amounts */}
                {isUnevenSplit && group && (
                  <div className="form-control mt-4">
                    <label className="label">
                      <span className="label-text font-semibold text-gray-700 text-sm">Split Per Person *</span>
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {group.members.map((member, idx) => {
                        const memberAmount = splitAmounts[member] || "";
                        const percentage = expenseAmount && memberAmount ? ((parseFloat(memberAmount) / parseFloat(expenseAmount)) * 100).toFixed(1) : "0";
                        
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="flex-1 min-w-0">
                              <Address address={member} disableAddressLink size="sm" />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.0001"
                                placeholder="0.0"
                                className="input input-bordered input-sm w-28 bg-white border-gray-300 text-right"
                                value={memberAmount}
                                onChange={(e) => {
                                  setSplitAmounts(prev => ({
                                    ...prev,
                                    [member]: e.target.value
                                  }));
                                }}
                                disabled={isAddingExpense}
                              />
                              <span className="text-xs text-gray-500 w-12">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {expenseAmount && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-gray-700">Total Split:</span>
                          <span className={`font-bold ${
                            Math.abs(
                              group.members.reduce((sum, member) => sum + parseFloat(splitAmounts[member] || "0"), 0) - 
                              parseFloat(expenseAmount)
                            ) < 0.0001 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {group.members.reduce((sum, member) => sum + parseFloat(splitAmounts[member] || "0"), 0).toFixed(4)} ETH
                            {Math.abs(
                              group.members.reduce((sum, member) => sum + parseFloat(splitAmounts[member] || "0"), 0) - 
                              parseFloat(expenseAmount)
                            ) < 0.0001 ? ' ✅' : ` (need ${expenseAmount} ETH)`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="card-actions justify-end mt-4">
                  <button
                    onClick={() => {
                      setShowAddExpense(false);
                      setIsUnevenSplit(false);
                      setSplitAmounts({});
                    }}
                    className="btn btn-sm bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700"
                    disabled={isAddingExpense}
                  >
                    Cancel
                  </button>
                  <button onClick={handleAddExpense} className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white border-0" disabled={isAddingExpense}>
                    {isAddingExpense ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Adding...
                      </>
                    ) : (
                      `Add ${isUnevenSplit ? 'Uneven' : 'Even'} Expense`
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Balances Section */}
            <div className="lg:col-span-1">
              <div className="card bg-white shadow-md border border-gray-200">
                <div className="card-body p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Balances</h2>
                  {!balances || balances.length === 0 ? (
                    <p className="text-gray-500 text-sm">No expenses yet</p>
                  ) : (
                    <div className="space-y-2">
                      {balances.map((balance, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Address address={balance.member} disableAddressLink size="sm" />
                          </div>
                          <div className={`text-right font-semibold text-sm ${balance.balance > 0n ? 'text-green-700' : balance.balance < 0n ? 'text-red-700' : 'text-gray-700'}`}>
                            {balance.balance > 0n && <ArrowTrendingUpIcon className="h-4 w-4 inline mr-1" />}
                            {balance.balance < 0n && <ArrowTrendingDownIcon className="h-4 w-4 inline mr-1" />}
                            <span className="text-xs block">{getBalanceText(balance.balance)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowSettleUp(!showSettleUp)}
                    className="btn bg-green-600 hover:bg-green-700 text-white border-0 btn-sm mt-4"
                    disabled={!connectedAddress || !balances || balances.length === 0}
                  >
                    💰 Settle Up
                  </button>

                  {/* Settle Up Form */}
                  {showSettleUp && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-semibold mb-3 text-gray-900 text-sm">Settle Up</h3>
                      <div className="form-control mb-3">
                        <label className="label">
                          <span className="label-text text-xs text-gray-700">Pay to (creditor address)</span>
                        </label>
                        <AddressInput
                          value={settlementCreditor}
                          onChange={setSettlementCreditor}
                          placeholder="0x..."
                        />
                      </div>
                      <div className="form-control mb-3">
                        <label className="label">
                          <span className="label-text text-xs text-gray-700">Amount (ETH)</span>
                        </label>
                        <EtherInput value={settlementAmount} onChange={setSettlementAmount} placeholder="0.0" />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowSettleUp(false)}
                          className="btn btn-xs flex-1 bg-gray-200 hover:bg-gray-300 border-0 text-gray-700"
                          disabled={isSettling}
                        >
                          Cancel
                        </button>
                        <button onClick={handleSettleUp} className="btn btn-xs flex-1 bg-green-600 hover:bg-green-700 text-white border-0" disabled={isSettling}>
                          {isSettling ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Settling...
                            </>
                          ) : (
                            "Confirm"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Expenses History Section */}
            <div className="lg:col-span-2">
              <div className="card bg-white shadow-md border border-gray-200">
                <div className="card-body p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Expense History</h2>
                  {!expenses || expenses.length === 0 ? (
                    <div className="text-center py-12">
                      <BanknotesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No expenses recorded yet</p>
                      <p className="text-sm text-gray-400 mt-2">Click "Add Expense" to get started!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr className="border-gray-200">
                            <th className="text-gray-700 font-semibold">Date</th>
                            <th className="text-gray-700 font-semibold">Description</th>
                            <th className="text-gray-700 font-semibold">Category</th>
                            <th className="text-gray-700 font-semibold">Paid By</th>
                            <th className="text-right text-gray-700 font-semibold">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((expense, index) => (
                            <tr key={index} className="border-gray-100 hover:bg-gray-50">
                              <td className="text-xs text-gray-600">
                                {new Date(Number(expense.timestamp) * 1000).toLocaleDateString()}
                              </td>
                              <td className="font-medium text-gray-900">{expense.description}</td>
                              <td>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{expense.category}</span>
                              </td>
                              <td>
                                <Address address={expense.paidBy} disableAddressLink size="sm" />
                              </td>
                              <td className="text-right font-semibold text-gray-900">{formatEther(expense.amount)} ETH</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Settlement History */}
              {settlementEvents && settlementEvents.length > 0 && (
                <div className="card bg-white shadow-md border border-gray-200 mt-4">
                  <div className="card-body p-5">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Settlement History</h2>
                    <div className="space-y-2">
                      {settlementEvents.map((event, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                          <div className="text-sm text-gray-700">
                            <Address address={event.args.from} disableAddressLink size="sm" />
                            <span className="mx-2">→</span>
                            <Address address={event.args.to} disableAddressLink size="sm" />
                          </div>
                          <div className="font-semibold text-green-700">
                            {event.args.amount ? formatEther(event.args.amount) : "0"} ETH
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupDetail;
