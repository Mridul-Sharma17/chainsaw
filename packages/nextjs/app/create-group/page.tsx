"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const CreateGroup: NextPage = () => {
  const router = useRouter();
  const { address: connectedAddress } = useAccount();

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [members, setMembers] = useState<string[]>([""]);
  const [isCreating, setIsCreating] = useState(false);

  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract("SplitChain");

  const addMember = () => {
    setMembers([...members, ""]);
  };

  const removeMember = (index: number) => {
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers.length === 0 ? [""] : newMembers);
  };

  const updateMember = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleCreateGroup = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!groupName.trim()) {
      notification.error("Please enter a group name");
      return;
    }

    // Filter out empty addresses and duplicates
    const validMembers = members
      .filter(m => m && m.trim() !== "")
      .filter((value, index, self) => self.indexOf(value) === index);

    // Add creator if not already in the list
    if (!validMembers.includes(connectedAddress)) {
      validMembers.unshift(connectedAddress);
    }

    if (validMembers.length < 2) {
      notification.error("A group needs at least 2 members (including yourself)");
      return;
    }

    setIsCreating(true);

    try {
      const tx = await writeYourContractAsync({
        functionName: "createGroup",
        args: [groupName, groupDescription, validMembers as `0x${string}`[]],
      });

      notification.success(
        <>
          <p className="font-bold">Group created successfully!</p>
          <p className="text-sm">Redirecting to home...</p>
        </>,
      );

      // Wait a bit for the transaction to be mined and redirect
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      console.error("Error creating group:", error);
      notification.error(error?.message || "Failed to create group");
      setIsCreating(false);
    }
  };

  if (!connectedAddress) {
    return (
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 w-full max-w-2xl">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <h2 className="card-title text-2xl mb-4">Wallet Not Connected</h2>
              <p className="text-base-content/70 mb-4">Please connect your wallet to create a group.</p>
              <Link href="/" className="btn btn-primary">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 w-full max-w-2xl">
          <Link href="/" className="btn btn-ghost btn-sm gap-2 mb-6">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-3xl mb-6">Create New Group</h2>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Group Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Weekend Trip, Apartment Rent, Office Lunch"
                  className="input input-bordered w-full"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  disabled={isCreating}
                />
              </div>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Description (Optional)</span>
                </label>
                <textarea
                  placeholder="Add details about this group..."
                  className="textarea textarea-bordered h-24 w-full"
                  value={groupDescription}
                  onChange={e => setGroupDescription(e.target.value)}
                  disabled={isCreating}
                />
              </div>

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-semibold">Members *</span>
                  <span className="label-text-alt text-base-content/50">You will be added automatically</span>
                </label>

                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="grow">
                        <AddressInput
                          placeholder={index === 0 ? "Add member address" : "Add another member"}
                          value={member}
                          onChange={value => updateMember(index, value)}
                          disabled={isCreating}
                        />
                      </div>
                      {members.length > 1 && (
                        <button
                          onClick={() => removeMember(index)}
                          className="btn btn-error btn-outline btn-sm"
                          disabled={isCreating}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button onClick={addMember} className="btn btn-outline btn-sm gap-2 mt-3 w-full" disabled={isCreating}>
                  <PlusCircleIcon className="h-5 w-5" />
                  Add Another Member
                </button>
              </div>

              <div className="alert alert-info shadow-lg mt-4">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current flex-shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span className="text-sm">
                    Groups need at least 2 members. You will be automatically added as a member and creator.
                  </span>
                </div>
              </div>

              <div className="card-actions justify-end mt-6">
                <Link href="/" className="btn btn-ghost" tabIndex={isCreating ? -1 : 0}>
                  Cancel
                </Link>
                <button
                  onClick={handleCreateGroup}
                  className="btn btn-primary gap-2"
                  disabled={isCreating || !groupName.trim()}
                >
                  {isCreating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusCircleIcon className="h-5 w-5" />
                      Create Group
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateGroup;
