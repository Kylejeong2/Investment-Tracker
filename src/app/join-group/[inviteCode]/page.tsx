'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function JoinGroup({ params }: { params: { inviteCode: string } }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [groupName, setGroupName] = useState('');

  const fetchGroupName = useCallback(async () => {
    const response = await fetch(`/api/groups/join?inviteCode=${params.inviteCode}`);
    const data = await response.json();
    if (data.groupName) {
      setGroupName(data.groupName);
    } else {
      router.push('/'); // Redirect if group not found
    }
  }, [params.inviteCode, router]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(`/sign-in?redirect=/join-group/${params.inviteCode}`);
    } else if (isLoaded && isSignedIn) {
      fetchGroupName();
    }
  }, [isLoaded, isSignedIn, router, params.inviteCode, fetchGroupName]);

  const handleJoinGroup = async () => {
    if (!user) return;

    setIsJoining(true);
    const response = await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: params.inviteCode, userId: user.id }),
    });

    if (response.ok) {
      router.push('/dashboard');
    } else {
      console.error('Failed to join group');
    }
    setIsJoining(false);
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4 text-blue-400">Join Group</h1>
        <p className="mb-6 text-gray-300">You&apos;ve been invited to join {groupName}!</p>
        <button
          onClick={handleJoinGroup}
          disabled={isJoining}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isJoining ? 'Joining...' : 'Join Group'}
        </button>
      </div>
    </div>
  );
}