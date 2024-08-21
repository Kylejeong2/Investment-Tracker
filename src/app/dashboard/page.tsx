'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useUser, useClerk } from '@clerk/nextjs';
import UserProfile from '@/components/UserProfile';
import GroupManagement from '@/components/GroupManagement';
import { useRouter } from 'next/navigation';
import GroupToggle from '@/components/GroupToggle';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  location: [number, number];
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
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingGroupId, setViewingGroupId] = useState<string | null>(null);
  const [isUserDataFetched, setIsUserDataFetched] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState<boolean | null>(null);

  const setupUser = async () => {
    setIsLoading(true);
    try {
      await createOrUpdateUser();
      await fetchUserData();
      await startLocationTracking();
      await fetchGroups(currentUser!);
      setIsUserDataFetched(true);
    } catch (error) {
      console.error('Error setting up user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setupUser();
    } else if (isLoaded && !isSignedIn) {
      router.push('/');
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user, router]);
// eslint-disable-next-line react-hooks/exhaustive-deps

  const createOrUpdateUser = async () => {
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
          longitude: null,
          latitude: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create or update user');
      }
    } catch (error) {
      console.error('Error creating or updating user:', error);
      throw error;
    }
  };

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await response.json();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const startLocationTracking = async () => {
    if ('geolocation' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
          setIsLocationPermissionGranted(true);
          initializeGeolocation();
        } else if (permission.state === 'prompt') {
          setIsLocationPermissionGranted(null);
          // The user will be prompted when we call getCurrentPosition
          navigator.geolocation.getCurrentPosition(
            () => {
              setIsLocationPermissionGranted(true);
              initializeGeolocation();
            },
            (error) => {
              console.error('Error getting user location:', error);
              setIsLocationPermissionGranted(false);
            }
          );
        } else {
          setIsLocationPermissionGranted(false);
        }
      } catch (error) {
        console.error('Error checking geolocation permission:', error);
        setIsLocationPermissionGranted(false);
      }
    } else {
      console.error('Geolocation is not supported by your browser');
      setIsLocationPermissionGranted(false);
    }
  };

  const initializeGeolocation = () => {
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const newLocation: [number, number] = [position.coords.longitude, position.coords.latitude];
        await updateUserLocation(newLocation);
      },
      (error) => {
        console.error('Error getting user location:', error);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    setWatchId(id);
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

  const leaveGroup = async (groupId: string) => {
    if (!currentUser) return;

    // Check if the user is the leader of the group
    const group = groups.find(g => g.id === groupId);
    if (group && group.leaderId === currentUser.id) {
      alert("You can&apos;t leave a group you&apos;re leading. Please delete the group or transfer leadership to another member.");
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to leave group');
      }

      // Refresh the groups list after successfully leaving
      fetchGroups(currentUser);
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const copyInviteLink = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/invite`);
      if (!response.ok) {
        throw new Error('Failed to get invite link');
      }
      const { inviteLink } = await response.json();
      await navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/join-group/${inviteLink}`);
      alert('Invite link copied to clipboard!');
    } catch (error) {
      console.error('Error copying invite link:', error);
      alert('Failed to copy invite link');
    }
  };

  const handleSignOut = async () => {
    await clerk.signOut();
    router.push('/');
  };

  const handleViewDetails = (groupId: string) => {
    setViewingGroupId(groupId === viewingGroupId ? null : groupId);
  };

  if (!isLoaded || isLoading || !isUserDataFetched) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isUserDataFetched) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading user data...</div>
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
        {isLocationPermissionGranted === null && (
          <div className="mb-4 bg-yellow-600 text-white p-4 rounded-md">
            <p>This app works best with location services enabled. Would you like to enable location services?</p>
            <button
              onClick={startLocationTracking}
              className="mt-2 bg-white text-yellow-600 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-300 ease-in-out"
            >
              Enable Location Services
            </button>
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6">
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
              <GroupToggle
                groups={groups}
                selectedGroupId={selectedGroupId}
                onGroupSelect={setSelectedGroupId}
                currentUserId={currentUser?.id}
              />
            </div>
            <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">Groups You Lead</h2>
                {groups.filter(group => group.leaderId === currentUser?.id).length === 0 ? (
                  <p className="text-gray-400">You don&apos;t lead any groups.</p>
                ) : (
                  <ul className="space-y-4">
                    {groups.filter(group => group.leaderId === currentUser?.id).map((group) => (
                      <li key={group.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold text-white">{group.name}</h3>
                          <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded-full">Leader</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Members: {group.members.length}</p>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleViewDetails(group.id)}
                            className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                          >
                            {viewingGroupId === group.id ? 'Hide Members' : 'View Members'}
                          </button>
                          <button
                            onClick={() => copyInviteLink(group.id)}
                            className="text-sm bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                          >
                            Copy Invite Link
                          </button>
                          <button
                            onClick={() => deleteGroup(group.id)}
                            className="text-sm bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                          >
                            Delete Group
                          </button>
                        </div>
                        {viewingGroupId === group.id && (
                          <div className="mt-2 bg-gray-700 p-2 rounded">
                            <h4 className="text-sm font-semibold mb-1">Group Members:</h4>
                            <ul className="text-sm">
                              {group.members.map((member) => (
                                <li key={member.id}>{`${member.firstName} ${member.lastName}`}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">Groups You&apos;re In</h2>
                {groups.filter(group => group.leaderId !== currentUser?.id).length === 0 ? (
                  <p className="text-gray-400">You are not a member of any groups yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {groups.filter(group => group.leaderId !== currentUser?.id).map((group) => (
                      <li key={group.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                        <h3 className="text-xl font-semibold text-white">{group.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">Members: {group.members.length}</p>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleViewDetails(group.id)}
                            className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                          >
                            {viewingGroupId === group.id ? 'Hide Details' : 'View Details'}
                          </button>
                          <button
                            onClick={() => leaveGroup(group.id)}
                            className="text-sm bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
                          >
                            Leave Group
                          </button>
                        </div>
                        {viewingGroupId === group.id && (
                          <div className="mt-2 bg-gray-700 p-2 rounded">
                            <h4 className="text-sm font-semibold mb-1">Group Members:</h4>
                            <ul className="text-sm">
                              {group.members.map((member) => (
                                <li key={member.id}>{`${member.firstName} ${member.lastName}`}</li>
                              ))}
                            </ul>
                          </div>
                        )}
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