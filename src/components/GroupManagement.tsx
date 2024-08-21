'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface GroupManagementProps {
  onGroupCreated: () => void;
}

function GroupManagement({ onGroupCreated }: GroupManagementProps) {
  const { user } = useUser();
  const [groupName, setGroupName] = useState('');

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await fetch('/api/groups/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName, userId: user.id }),
      });

      if (!response.ok) throw new Error('Failed to create group');

      setGroupName('');
      onGroupCreated(); // Call onGroupCreated() after successfully creating a group
      // Optionally, refresh the groups list or update UI
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-400">Group Management</h2>
      <form onSubmit={createGroup} className="space-y-4">
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="New group name"
          className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out"
        >
          Create Group
        </button>
      </form>
      {/* Add UI for other group management functions */}
    </div>
  );
}

export default GroupManagement;