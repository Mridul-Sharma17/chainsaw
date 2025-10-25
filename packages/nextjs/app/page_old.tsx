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

  // Fetch user's groups
  const { data: userGroupIds } = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getUserGroups",
    args: [connectedAddress],
  });

  // Fetch details for each group
  const { data: groups } = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroup",
    args: userGroupIds && userGroupIds.length > 0 ? [userGroupIds[0]] : [0n],
  });

  return (
    <>
      <div className="flex items-center flex-col grow">
        {/* Hero Section with Gradient */}
        <div className="w-full bg-gradient-to-br from-primary via-secondary to-accent py-20 px-5 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-10 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-10 left-1/2 w-80 h-80 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse delay-500"></div>
          </div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-block animate-bounce mb-6">
              <span className="text-8xl drop-shadow-2xl">💸</span>
            </div>
            <h1 className="text-7xl font-black mb-6 text-white drop-shadow-lg">
              SplitChain
            </h1>
            <p className="text-3xl font-bold text-white/90 mb-4 drop-shadow-md">
              Decentralized Expense Splitting
            </p>
            <p className="text-white/80 max-w-2xl mx-auto mb-8 text-lg leading-relaxed drop-shadow">
              Split bills with friends on the blockchain. Transparent, trustless, and unstoppable.
              No middleman, no fees, just pure Web3 magic! ✨
            </p>
            
            {connectedAddress ? (
              <div className="flex gap-4 justify-center items-center flex-wrap mb-6">
                <div className="stats shadow-2xl bg-white/95 backdrop-blur">
                  <div className="stat place-items-center py-4 px-8">
                    <div className="stat-title font-semibold text-base-content/70">Your Groups</div>
                    <div className="stat-value text-4xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {userGroupIds?.length || 0}
                    </div>
                    <div className="stat-desc text-base-content/60">Active groups</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 justify-center flex-wrap mt-8">
                <div className="badge badge-lg bg-white/90 text-primary border-0 gap-2 py-4 px-4 shadow-lg">
                  <span className="text-xl">📊</span> Track Expenses
                </div>
                <div className="badge badge-lg bg-white/90 text-secondary border-0 gap-2 py-4 px-4 shadow-lg">
                  <span className="text-xl">⚡</span> Instant Settlement
                </div>
                <div className="badge badge-lg bg-white/90 text-accent border-0 gap-2 py-4 px-4 shadow-lg">
                  <span className="text-xl">🔒</span> Blockchain Secured
                </div>
              </div>
            )}
            
            {!connectedAddress && (
              <div className="mt-8">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white border-2 border-white/30 shadow-xl">
                  <span className="animate-pulse text-xl">👆</span>
                  <span className="font-semibold">Connect wallet to get started</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 w-full max-w-5xl mt-8">

          {!connectedAddress ? (
            <div className="flex flex-col items-center justify-center mt-8">
              <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-2xl max-w-xl border-2 border-primary/30">
                <div className="card-body items-center text-center p-10">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-xl">
                    <UsersIcon className="h-14 w-14 text-white" />
                  </div>
                  <h2 className="card-title text-4xl mb-4 font-black">Get Started!</h2>
                  <p className="text-base-content/70 mb-3 text-xl">
                    Connect your wallet to create groups and split expenses.
                  </p>
                  <div className="divider my-4">How it works</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-6">
                    <div className="card bg-primary/10 shadow-md">
                      <div className="card-body items-center text-center p-4">
                        <div className="text-4xl mb-2">1️⃣</div>
                        <div className="font-bold text-sm">Create Group</div>
                        <div className="text-xs text-base-content/60">Add your friends</div>
                      </div>
                    </div>
                    <div className="card bg-secondary/10 shadow-md">
                      <div className="card-body items-center text-center p-4">
                        <div className="text-4xl mb-2">2️⃣</div>
                        <div className="font-bold text-sm">Add Expenses</div>
                        <div className="text-xs text-base-content/60">Track spending</div>
                      </div>
                    </div>
                    <div className="card bg-accent/10 shadow-md">
                      <div className="card-body items-center text-center p-4">
                        <div className="text-4xl mb-2">3️⃣</div>
                        <div className="font-bold text-sm">Settle Up</div>
                        <div className="text-xs text-base-content/60">Send ETH instantly</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm bg-primary/10 px-4 py-2 rounded-lg text-base-content/70 mb-4 border border-primary/20">
                    👆 Click <span className="font-bold text-primary">"Connect Wallet"</span> in the top right corner
                  </p>
                  <div className="flex gap-3 text-sm flex-wrap justify-center">
                    <div className="badge badge-primary badge-lg gap-2">📊 Smart Balances</div>
                    <div className="badge badge-secondary badge-lg gap-2">⚡ Zero Fees</div>
                    <div className="badge badge-accent badge-lg gap-2">🔒 Trustless</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Personal Dashboard */}
              {userGroupIds && userGroupIds.length > 0 && (
                <PersonalDashboard groupIds={userGroupIds} userAddress={connectedAddress} />
              )}
              
              <div className="flex justify-between items-center mb-6 mt-8">
                <h2 className="text-3xl font-bold flex items-center gap-2">
                  <span>My Groups</span>
                  {userGroupIds && userGroupIds.length > 0 && (
                    <span className="badge badge-primary badge-lg">{userGroupIds.length}</span>
                  )}
                </h2>
                <Link href="/create-group" className="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-all">
                  <PlusCircleIcon className="h-5 w-5" />
                  Create Group
                </Link>
              </div>

              {!userGroupIds || userGroupIds.length === 0 ? (
                <div className="card bg-gradient-to-br from-base-200 to-base-300 shadow-xl border border-base-content/10">
                  <div className="card-body items-center text-center py-16">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                      <UsersIcon className="h-14 w-14 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">No groups yet</h3>
                    <p className="text-base-content/70 mb-6 max-w-md">
                      Create your first group to start splitting expenses with friends on the blockchain!
                    </p>
                    <Link href="/create-group" className="btn btn-primary btn-lg gap-2 shadow-lg hover:scale-105 transition-transform">
                      <PlusCircleIcon className="h-6 w-6" />
                      Create Your First Group
                    </Link>
                    <div className="divider my-6">✨ Features ✨</div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-3xl mb-2">🔗</div>
                        <div className="font-semibold">Blockchain</div>
                        <div className="text-xs text-base-content/50">Permanent Records</div>
                      </div>
                      <div>
                        <div className="text-3xl mb-2">🧮</div>
                        <div className="font-semibold">Auto-Calculate</div>
                        <div className="text-xs text-base-content/50">Smart Balances</div>
                      </div>
                      <div>
                        <div className="text-3xl mb-2">⚡</div>
                        <div className="font-semibold">Instant</div>
                        <div className="text-xs text-base-content/50">ETH Settlements</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userGroupIds.map((groupId) => (
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

// Component to fetch and display individual group
const GroupCard = ({ groupId }: { groupId: bigint }) => {
  const { data: group } = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroup",
    args: [groupId],
  });

  const { data: expenseCount } = useScaffoldReadContract({
    contractName: "SplitChain",
    functionName: "getGroupExpenseCount",
    args: [groupId],
  });

  if (!group) {
    return (
      <div className="card bg-base-100 shadow-lg animate-pulse border border-base-300">
        <div className="card-body">
          <div className="h-6 bg-base-300 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-base-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-base-300 rounded w-2/3 mb-3"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-base-300 rounded w-20"></div>
            <div className="h-8 bg-base-300 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link 
      href={`/group/${groupId}`} 
      className="card bg-gradient-to-br from-base-100 to-base-200 shadow-lg hover:shadow-2xl transition-all hover:scale-105 hover:-translate-y-1 border border-primary/20 hover:border-primary/50"
    >
      <div className="card-body">
        <div className="flex justify-between items-start mb-2">
          <h3 className="card-title text-lg flex-1">{group.name}</h3>
          {group.active && <span className="badge badge-success badge-sm">Active</span>}
        </div>
        <p className="text-sm text-base-content/70 line-clamp-2 mb-3">{group.description || "No description"}</p>
        <div className="flex gap-2 flex-wrap">
          <div className="badge badge-outline gap-1">
            <UsersIcon className="h-3 w-3" />
            {group.members?.length || 0} members
          </div>
          <div className="badge badge-outline badge-secondary gap-1">
            💰 {expenseCount?.toString() || "0"} expenses
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-base-300 text-xs text-base-content/50">
          Click to view details →
        </div>
      </div>
    </Link>
  );
};

// Personal Dashboard Component
const PersonalDashboard = ({ groupIds, userAddress }: { groupIds: readonly bigint[]; userAddress: string }) => {
  // Fetch all group data
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

  // Calculate dashboard stats
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

    const topCategory = Object.entries(categorySpending).sort((a, b) => (a[1] > b[1] ? -1 : 1))[0];

    return {
      totalSpent,
      totalExpenses,
      myBalance,
      activeGroups,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
      categorySpending,
    };
  }, [groupsData, userAddress]);

  return (
    <div className="mb-8">
      <h2 className="text-3xl font-black mb-4 flex items-center gap-2">
        <span>📊 Your Dashboard</span>
      </h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Spent */}
        <div className="stat bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg rounded-xl border-2 border-primary/20">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-10 h-10 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
            </svg>
          </div>
          <div className="stat-title font-semibold">Total Spent</div>
          <div className="stat-value text-primary text-2xl">{parseFloat(formatEther(stats.totalSpent)).toFixed(3)}</div>
          <div className="stat-desc font-semibold">ETH across all groups</div>
        </div>

        {/* My Balance */}
        <div className={`stat shadow-lg rounded-xl border-2 ${stats.myBalance >= 0n ? 'bg-gradient-to-br from-success/10 to-success/5 border-success/20' : 'bg-gradient-to-br from-error/10 to-error/5 border-error/20'}`}>
          <div className={`stat-figure ${stats.myBalance >= 0n ? 'text-success' : 'text-error'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-10 h-10 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
          </div>
          <div className="stat-title font-semibold">My Balance</div>
          <div className={`stat-value text-2xl ${stats.myBalance >= 0n ? 'text-success' : 'text-error'}`}>
            {stats.myBalance >= 0n ? '+' : ''}{parseFloat(formatEther(stats.myBalance)).toFixed(3)}
          </div>
          <div className="stat-desc font-semibold">
            {stats.myBalance > 0n ? 'You get back' : stats.myBalance < 0n ? 'You owe' : 'Settled up'}
          </div>
        </div>

        {/* Active Groups */}
        <div className="stat bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-lg rounded-xl border-2 border-secondary/20">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-10 h-10 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <div className="stat-title font-semibold">Active Groups</div>
          <div className="stat-value text-secondary text-2xl">{stats.activeGroups}</div>
          <div className="stat-desc font-semibold">of {groupIds.length} total</div>
        </div>

        {/* Total Expenses */}
        <div className="stat bg-gradient-to-br from-accent/10 to-accent/5 shadow-lg rounded-xl border-2 border-accent/20">
          <div className="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-10 h-10 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div className="stat-title font-semibold">Total Expenses</div>
          <div className="stat-value text-accent text-2xl">{stats.totalExpenses}</div>
          <div className="stat-desc font-semibold">transactions recorded</div>
        </div>
      </div>

      {/* Charts Section */}
      {stats.topCategory && (
        <div className="card bg-base-100 shadow-xl border-2 border-base-300">
          <div className="card-body">
            <h3 className="card-title text-xl mb-4">📈 Spending by Category</h3>
            <div className="space-y-3">
              {Object.entries(stats.categorySpending)
                .sort((a, b) => (a[1] > b[1] ? -1 : 1))
                .slice(0, 5)
                .map(([category, amount], index) => {
                  const percentage = Number((amount * 100n) / (stats.totalSpent || 1n));
                  const colors = ['primary', 'secondary', 'accent', 'success', 'warning'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={category}>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="font-semibold">
                          {category === 'Food' && '🍔'}{category === 'Transport' && '🚗'}
                          {category === 'Accommodation' && '🏠'}{category === 'Entertainment' && '🎬'}
                          {category === 'Shopping' && '🛍️'}{category === 'Utilities' && '💡'}
                          {category === 'Other' && '📦'} {category}
                        </span>
                        <span className="font-bold text-base-content">
                          {parseFloat(formatEther(amount)).toFixed(3)} ETH ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <progress 
                        className={`progress progress-${color} w-full h-3`} 
                        value={percentage} 
                        max="100"
                      ></progress>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
