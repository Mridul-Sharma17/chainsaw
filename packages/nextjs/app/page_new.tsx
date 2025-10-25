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

  return (
    <>
      <div className="flex items-center flex-col grow bg-gray-50 min-h-screen">
        {/* Compact Header */}
        <div className="w-full bg-white border-b border-gray-200 py-3 px-5 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💸</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SplitChain</h1>
                <p className="text-xs text-gray-600">Decentralized Expense Splitting</p>
              </div>
            </div>
            
            {!connectedAddress && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span>👉</span> Connect wallet to start
              </div>
            )}
          </div>
        </div>

        <div className="px-5 w-full max-w-7xl mt-4">

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
              {/* Personal Dashboard Component */}
              {userGroupIds && userGroupIds.length > 0 && (
                <PersonalDashboard groupIds={userGroupIds} userAddress={connectedAddress} />
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

// Personal Dashboard Component - Modern Light UI
const PersonalDashboard = ({ groupIds, userAddress }: { groupIds: readonly bigint[]; userAddress: string }) => {
  const groupsData = groupIds.map(id => {
    const { data: group } = useScaffoldReadContract({
      contractName: "SplitChain",
      functionName: "getGroup",
      args: [id],
    });
    const { data: expenses } = useScaffoldReadContract({
      contractName: "SplitChain",
      functionName: "getGroupExpenses",
      args: [id],
    });
    const { data: balances } = useScaffoldReadContract({
      contractName: "SplitChain",
      functionName: "getGroupBalances",
      args: [id],
    });
    return { id, group, expenses, balances };
  });

  const stats = useMemo(() => {
    let totalSpent = 0n;
    let totalExpenses = 0;
    let myBalance = 0n;
    let activeGroups = 0;
    const categorySpending: Record<string, bigint> = {};

    groupsData.forEach(({ group, expenses, balances }) => {
      if (!group || !expenses) return;
      
      if (group.active) activeGroups++;
      totalExpenses += expenses.length;
      
      expenses.forEach(exp => {
        totalSpent += exp.amount;
        categorySpending[exp.category] = (categorySpending[exp.category] || 0n) + exp.amount;
      });

      if (balances) {
        const myBal = balances.find(b => b.member.toLowerCase() === userAddress.toLowerCase());
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
  }, [groupsData, userAddress]);

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-3 text-gray-900">📊 Dashboard</h2>
      
      {/* Compact Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-gray-900">{parseFloat(formatEther(stats.totalSpent)).toFixed(3)}</div>
          <div className="text-xs text-gray-500 mt-1">ETH</div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm border ${stats.myBalance >= 0n ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="text-xs text-gray-600 mb-1">My Balance</div>
          <div className={`text-2xl font-bold ${stats.myBalance >= 0n ? 'text-green-700' : 'text-red-700'}`}>
            {stats.myBalance >= 0n ? '+' : ''}{parseFloat(formatEther(stats.myBalance)).toFixed(3)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {stats.myBalance > 0n ? 'You get back' : stats.myBalance < 0n ? 'You owe' : 'Settled'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Active Groups</div>
          <div className="text-2xl font-bold text-gray-900">{stats.activeGroups}</div>
          <div className="text-xs text-gray-500 mt-1">of {groupIds.length} total</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalExpenses}</div>
          <div className="text-xs text-gray-500 mt-1">transactions</div>
        </div>
      </div>

      {/* Category Breakdown Chart */}
      {Object.keys(stats.categorySpending).length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold mb-3 text-gray-900">Spending by Category</h3>
          <div className="space-y-2">
            {Object.entries(stats.categorySpending)
              .sort((a, b) => (a[1] > b[1] ? -1 : 1))
              .slice(0, 5)
              .map(([category, amount], index) => {
                const percentage = Number((amount * 100n) / (stats.totalSpent || 1n));
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
  );
};

export default Home;
