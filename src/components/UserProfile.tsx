import React from 'react';
import Image from 'next/image';

interface UserProfileProps {
  name: string;
  email: string;
  profilePicture: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ name, email, profilePicture }) => {
  return (
    <div className="bg-gray-800 shadow-md rounded-lg p-6">
      <div className="flex items-center space-x-4">
        <Image src={profilePicture} alt={name} width={64} height={64} className="rounded-full" />
        <div>
          <h2 className="text-xl font-bold text-blue-400">{name}</h2>
          <p className="text-gray-400">{email}</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;