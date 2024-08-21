import React from 'react';

interface Group {
  id: string;
  name: string;
  leaderId: string;
}

interface GroupToggleProps {
  groups: Group[];
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string) => void;
  currentUserId: string | undefined;
}

const GroupToggle: React.FC<GroupToggleProps> = ({ groups, selectedGroupId, onGroupSelect, currentUserId }) => {
  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold text-white mb-4">Select Group to View</h3>
      <div className="space-y-2">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onGroupSelect(group.id)}
            className={`w-full text-left p-2 rounded ${
              selectedGroupId === group.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            } ${group.leaderId === currentUserId ? 'border-l-4 border-green-500' : ''}`}
          >
            <span className="text-white">{group.name}</span>
            {group.leaderId === currentUserId && (
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">Leader</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GroupToggle;