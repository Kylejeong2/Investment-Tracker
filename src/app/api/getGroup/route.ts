import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $groups, $groupMembers, $users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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
      leaderId: $groups.leaderId,
    })
    .from($groupMembers)
    .innerJoin($groups, eq($groupMembers.groupId, $groups.id))
    .where(eq($groupMembers.userId, userId));

  const groupsWithMembers = await Promise.all(userGroups.map(async (group) => {
    const members = await db
      .select({
        id: $users.id,
        firstName: $users.firstName,
        lastName: $users.lastName,
        email: $users.email,
        profilePicture: $users.profilePicture,
        longitude: $users.longitude,
        latitude: $users.latitude,
      })
      .from($groupMembers)
      .innerJoin($users, eq($groupMembers.userId, $users.id))
      .where(eq($groupMembers.groupId, group.id));

    const groupMembers = members.map(member => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      profilePicture: member.profilePicture,
      location: [member.longitude, member.latitude],
    }));

    return {
      ...group,
      members: groupMembers,
    };
  }));

  return NextResponse.json(groupsWithMembers);
}