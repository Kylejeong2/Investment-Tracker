'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useUser, useClerk } from '@clerk/nextjs';
import UserProfile from '@/components/UserProfile';
import GroupManagement from '@/components/GroupManagement';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  location: [number, number]; // [longitude, latitude]
  profilePicture: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  leaderId: string;
  members: User[];
}

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      startLocationTracking();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isLoaded, isSignedIn, user]);

  const startLocationTracking = () => {
    if ('geolocation' in navigator) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: [number, number] = [position.coords.longitude, position.coords.latitude];
          updateUserLocation(newLocation);
        },
        (error) => {
          console.error('Error getting user location:', error);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      setWatchId(id);
    } else {
      console.error('Geolocation is not supported by your browser');
    }
  };

  const updateUserLocation = async (location: [number, number]) => {
    if (!user) return;

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.imageUrl,
          longitude: location[0],
          latitude: location[1],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user location');
      }

      const userData = await response.json();
      setCurrentUser({...userData, location});
      fetchGroups({...userData, location});
    } catch (error) {
      console.error('Error updating user location:', error);
    }
  };

  const fetchGroups = async (currentUser: User) => {
    try {
      const response = await fetch(`/api/getGroup?userId=${currentUser.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const groupsData = await response.json();
      setGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      // Refresh the groups list after successful deletion
      fetchGroups(currentUser!);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleSignOut = async () => {
    const router = useRouter();
    await clerk.signOut();
    router.push('/');
  };

  const copyInviteLink = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/invite`);
      if (!response.ok) {
        throw new Error('Failed to get invite link');
      }
      const { inviteLink } = await response.json();
      await navigator.clipboard.writeText(`${window.location.origin}/join-group/${inviteLink}`);
      alert('Invite link copied to clipboard!');
    } catch (error) {
      console.error('Error copying invite link:', error);
      alert('Failed to copy invite link');
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-bold text-blue-400">ZFellows Investment Tracker</h1>
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300 ease-in-out"
          >
            Sign Out
          </button>
        </header>
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-1/3 space-y-6">
            {currentUser && (
              <UserProfile
                name={`${currentUser.firstName} ${currentUser.lastName}`}
                email={currentUser.email}
                profilePicture={currentUser.profilePicture}
              />
            )}
            <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <GroupManagement onGroupCreated={() => fetchGroups(currentUser!)} />
            </div>
            <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">Your Groups</h2>
                {groups.length === 0 ? (
                  <p className="text-gray-400">You are not a member of any groups yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {groups.map((group) => (
                      <li key={group.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-white">{group.name}</h3>
                          {group.leaderId === currentUser?.id && (
                            <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded-full">Leader</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Members: {group.members.length}</p>
                        <div className="flex space-x-2 mt-2">
                          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                            View Details
                          </button>
                          <button
                            onClick={() => copyInviteLink(group.id)}
                            className="text-sm text-green-400 hover:text-green-300 transition-colors"
                          >
                            Invite
                          </button>
                          {group.leaderId === currentUser?.id && (
                            <button
                              onClick={() => deleteGroup(group.id)}
                              className="text-sm text-red-400 hover:text-red-300 transition-colors"
                            >
                              Delete Group
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">Groups You're In</h2>
                {groups.length === 0 ? (
                  <p className="text-gray-400">You are not a member of any groups yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {groups.filter(group => group.leaderId !== currentUser?.id).map((group) => (
                      <li key={group.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                        <h3 className="text-xl font-semibold text-white">{group.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">Members: {group.members.length}</p>
                        <button className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                          View Details
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
          <section className="w-full lg:w-2/3">
            <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden h-[600px]">
              <Map currentUser={currentUser ? {...currentUser, name: `${currentUser.firstName} ${currentUser.lastName}`} : null} groups={groups} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}