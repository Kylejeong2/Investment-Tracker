import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $groups, $groupMembers, $users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const userGroups = await db
    .select({
      id: $groups.id,
      name: $groups.name,
    })
    .from($groupMembers)
    .innerJoin($groups, eq($groupMembers.groupId, $groups.id))
    .where(eq($groupMembers.userId, userId));

  const groupsWithMembers = await Promise.all(userGroups.map(async ($group) => {
    const members = await db
      .select({
        id: $groupMembers.userId,
        email: $users.email,
        profilePicture: $users.profilePicture,
      })
      .from($groupMembers)
      .innerJoin($users, eq($groupMembers.userId, $users.id))
      .where(eq($groupMembers.groupId, $group.id));

    const groupMembers = members.map(member => ({
      id: member.id,
      email: member.email,
      profilePicture: member.profilePicture,
      location: [0, 0], // Default location or use null if preferred
    }));

    return {
      ...$group,
      members: groupMembers,
    };
  }));

  return NextResponse.json(groupsWithMembers);
}