"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { PlusCircleIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const { data: userGroupIds } = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getUserGroups",
    args: [connectedAddress],
  });

  // Fetch data for up to 5 groups (fixed number of hooks)
  const group0 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroup",
    args: [userGroupIds && userGroupIds[0] ? userGroupIds[0] : 0n],
  });
  const expenses0 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupExpenses",
    args: [userGroupIds && userGroupIds[0] ? userGroupIds[0] : 0n],
  });
  const balances0 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupBalances",
    args: [userGroupIds && userGroupIds[0] ? userGroupIds[0] : 0n],
  });

  const group1 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroup",
    args: [userGroupIds && userGroupIds[1] ? userGroupIds[1] : 0n],
  });
  const expenses1 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupExpenses",
    args: [userGroupIds && userGroupIds[1] ? userGroupIds[1] : 0n],
  });
  const balances1 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupBalances",
    args: [userGroupIds && userGroupIds[1] ? userGroupIds[1] : 0n],
  });

  const group2 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroup",
    args: [userGroupIds && userGroupIds[2] ? userGroupIds[2] : 0n],
  });
  const expenses2 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupExpenses",
    args: [userGroupIds && userGroupIds[2] ? userGroupIds[2] : 0n],
  });
  const balances2 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupBalances",
    args: [userGroupIds && userGroupIds[2] ? userGroupIds[2] : 0n],
  });

  const group3 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroup",
    args: [userGroupIds && userGroupIds[3] ? userGroupIds[3] : 0n],
  });
  const expenses3 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupExpenses",
    args: [userGroupIds && userGroupIds[3] ? userGroupIds[3] : 0n],
  });
  const balances3 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupBalances",
    args: [userGroupIds && userGroupIds[3] ? userGroupIds[3] : 0n],
  });

  const group4 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroup",
    args: [userGroupIds && userGroupIds[4] ? userGroupIds[4] : 0n],
  });
  const expenses4 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupExpenses",
    args: [userGroupIds && userGroupIds[4] ? userGroupIds[4] : 0n],
  });
  const balances4 = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupBalances",
    args: [userGroupIds && userGroupIds[4] ? userGroupIds[4] : 0n],
  });

  // Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    if (!connectedAddress) return null;

    const allGroupsData = [
      { group: group0.data, expenses: expenses0.data, balances: balances0.data },
      { group: group1.data, expenses: expenses1.data, balances: balances1.data },
      { group: group2.data, expenses: expenses2.data, balances: balances2.data },
      { group: group3.data, expenses: expenses3.data, balances: balances3.data },
      { group: group4.data, expenses: expenses4.data, balances: balances4.data },
    ];

    let totalSpent = 0n;
    let totalExpenses = 0;
    let myBalance = 0n;
    let activeGroups = 0;
    const categorySpending: Record<string, bigint> = {};

    allGroupsData.forEach(({ group, expenses, balances }) => {
      if (!group || !expenses) return;

      if (group.active) activeGroups++;
      totalExpenses += expenses.length;

      expenses.forEach(exp => {
        totalSpent += exp.amount;
        categorySpending[exp.category] = (categorySpending[exp.category] || 0n) + exp.amount;
      });

      if (balances) {
        const myBal = balances.find(b => b.member.toLowerCase() === connectedAddress.toLowerCase());
        if (myBal) myBalance += myBal.balance;
      }
    });

    return {
      totalSpent,
      totalExpenses,
      myBalance,
      activeGroups,
      categorySpending,
    };
  }, [
    connectedAddress,
    group0.data,
    expenses0.data,
    balances0.data,
    group1.data,
    expenses1.data,
    balances1.data,
    group2.data,
    expenses2.data,
    balances2.data,
    group3.data,
    expenses3.data,
    balances3.data,
    group4.data,
    expenses4.data,
    balances4.data,
  ]);

  return (
    <>
      <div className="flex items-center flex-col grow bg-gray-50 min-h-screen">
        {/* Clean Centered Header */}
        <div className="w-full bg-white border-b border-gray-200 py-6 px-5">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-4xl">💸</span>
              <h1 className="text-3xl font-bold text-gray-900">SplitChain</h1>
            </div>
            <p className="text-gray-600 text-sm">Decentralized Expense Splitting</p>
            
            {connectedAddress && userGroupIds && userGroupIds.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-gray-500">{userGroupIds.length} {userGroupIds.length === 1 ? 'Group' : 'Groups'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 w-full max-w-7xl mt-6">

          {!connectedAddress ? (
            <div className="flex flex-col items-center justify-center mt-12">
              <div className="card bg-white shadow-md max-w-md border border-gray-200">
                <div className="card-body items-center text-center p-8">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <UsersIcon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-gray-900">Welcome to SplitChain</h2>
                  <p className="text-gray-600 mb-6 text-sm">
                    Connect your wallet to create groups, split expenses, and settle up on the blockchain.
                  </p>
                  
                  <div className="w-full space-y-2">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">1</div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 text-sm">Create Groups</div>
                        <div className="text-xs text-gray-600">Add friends to split expenses</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">2</div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 text-sm">Track Expenses</div>
                        <div className="text-xs text-gray-600">Add bills and see who owes what</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">3</div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 text-sm">Settle Up</div>
                        <div className="text-xs text-gray-600">Pay balances with ETH instantly</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Personal Dashboard */}
              {dashboardStats && userGroupIds && userGroupIds.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-3 text-gray-900">📊 Dashboard</h2>
                  
                  {/* Compact Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Total Spent</div>
                      <div className="text-2xl font-bold text-gray-900">{parseFloat(formatEther(dashboardStats.totalSpent)).toFixed(3)}</div>
                      <div className="text-xs text-gray-500 mt-1">ETH</div>
                    </div>

                    <div className={`p-4 rounded-lg shadow-sm border ${dashboardStats.myBalance >= 0n ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="text-xs text-gray-600 mb-1">My Balance</div>
                      <div className={`text-2xl font-bold ${dashboardStats.myBalance >= 0n ? 'text-green-700' : 'text-red-700'}`}>
                        {dashboardStats.myBalance >= 0n ? '+' : ''}{parseFloat(formatEther(dashboardStats.myBalance)).toFixed(3)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {dashboardStats.myBalance > 0n ? 'You get back' : dashboardStats.myBalance < 0n ? 'You owe' : 'Settled'}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Active Groups</div>
                      <div className="text-2xl font-bold text-gray-900">{dashboardStats.activeGroups}</div>
                      <div className="text-xs text-gray-500 mt-1">of {userGroupIds.length} total</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Total Expenses</div>
                      <div className="text-2xl font-bold text-gray-900">{dashboardStats.totalExpenses}</div>
                      <div className="text-xs text-gray-500 mt-1">transactions</div>
                    </div>
                  </div>

                  {/* Category Breakdown Chart */}
                  {Object.keys(dashboardStats.categorySpending).length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-sm font-bold mb-3 text-gray-900">Spending by Category</h3>
                      <div className="space-y-2">
                        {Object.entries(dashboardStats.categorySpending)
                          .sort((a, b) => (a[1] > b[1] ? -1 : 1))
                          .slice(0, 5)
                          .map(([category, amount], index) => {
                            const percentage = Number((amount * 100n) / (dashboardStats.totalSpent || 1n));
                            const colors = [
                              { bg: 'bg-blue-500', light: 'bg-blue-100' },
                              { bg: 'bg-purple-500', light: 'bg-purple-100' },
                              { bg: 'bg-green-500', light: 'bg-green-100' },
                              { bg: 'bg-orange-500', light: 'bg-orange-100' },
                              { bg: 'bg-pink-500', light: 'bg-pink-100' },
                            ];
                            const color = colors[index % colors.length];
                            
                            const emoji = category === 'Food' ? '🍔' : category === 'Transport' ? '🚗' :
                              category === 'Accommodation' ? '🏠' : category === 'Entertainment' ? '🎬' :
                              category === 'Shopping' ? '🛍️' : category === 'Utilities' ? '💡' : '📦';
                            
                            return (
                              <div key={category}>
                                <div className="flex justify-between mb-1 text-xs">
                                  <span className="font-semibold text-gray-700">
                                    {emoji} {category}
                                  </span>
                                  <span className="font-bold text-gray-900">
                                    {parseFloat(formatEther(amount)).toFixed(3)} ETH ({percentage.toFixed(1)}%)
                                  </span>
                                </div>
                                <div className={`w-full ${color.light} rounded-full h-2`}>
                                  <div
                                    className={`${color.bg} h-2 rounded-full transition-all`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center mb-4 mt-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                  <span>My Groups</span>
                  {userGroupIds && userGroupIds.length > 0 && (
                    <span className="badge bg-blue-100 text-blue-700 border-0">{userGroupIds.length}</span>
                  )}
                </h2>
                <Link href="/create-group" className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white border-0 gap-2">
                  <PlusCircleIcon className="h-4 w-4" />
                  Create Group
                </Link>
              </div>

              {!userGroupIds || userGroupIds.length === 0 ? (
                <div className="card bg-white shadow-md border border-gray-200">
                  <div className="card-body items-center text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <UsersIcon className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">No groups yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md text-sm">
                      Create your first group to start splitting expenses with friends on the blockchain!
                    </p>
                    <Link href="/create-group" className="btn bg-blue-600 hover:bg-blue-700 text-white border-0 gap-2">
                      <PlusCircleIcon className="h-5 w-5" />
                      Create Your First Group
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userGroupIds?.map((groupId) => (
                    <GroupCard key={groupId.toString()} groupId={groupId} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

// Group Card Component
const GroupCard = ({ groupId }: { groupId: bigint }) => {
  const { data: group } = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroup",
    args: [groupId],
  });

  const { data: expenses } = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupExpenses",
    args: [groupId],
  });

  if (!group) return null;

  const totalExpenses = expenses?.length || 0;
  const totalSpent = expenses?.reduce((sum, exp) => sum + exp.amount, 0n) || 0n;

  return (
    <Link href={`/group/${groupId}`}>
      <div className="card bg-white hover:shadow-lg transition-all cursor-pointer border border-gray-200 h-full">
        <div className="card-body p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="card-title text-lg text-gray-900">{group.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{group.members.length} members</p>
            </div>
            <div className={`badge badge-sm ${group.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} border-0`}>
              {group.active ? "Active" : "Inactive"}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-600 mb-1">Total Spent</div>
              <div className="text-lg font-bold text-gray-900">{parseFloat(formatEther(totalSpent)).toFixed(3)} ETH</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="text-xs text-gray-600 mb-1">Expenses</div>
              <div className="text-lg font-bold text-gray-900">{totalExpenses}</div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-600 mb-2">Members:</div>
            <div className="flex flex-wrap gap-1">
              {group.members.slice(0, 3).map((member) => (
                <div key={member} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                  {member.slice(0, 6)}...{member.slice(-4)}
                </div>
              ))}
              {group.members.length > 3 && (
                <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                  +{group.members.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Home;
