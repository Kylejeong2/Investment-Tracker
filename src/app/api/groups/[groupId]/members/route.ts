import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $groupMembers, $users, $groups } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const { userId } = auth();
  const groupId = params.groupId;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if the user is the leader of the group
    const [group] = await db.select().from($groups).where(eq($groups.id, groupId));
    
    console.log('Group:', group); // Debug log
    console.log('User ID:', userId); // Debug log

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.leaderId !== userId) {
      console.log('Leader ID mismatch. Group leader:', group.leaderId, 'User ID:', userId); // Debug log
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const members = await db
      .select({
        id: $users.id,
        firstName: $users.firstName,
        lastName: $users.lastName,
        profilePicture: $users.profilePicture,
        latitude: $users.latitude,
        longitude: $users.longitude,
      })
      .from($groupMembers)
      .innerJoin($users, eq($groupMembers.userId, $users.id))
      .where(eq($groupMembers.groupId, groupId));

    const formattedMembers = members.map(member => ({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      profilePicture: member.profilePicture,
      location: [Number(member.longitude), Number(member.latitude)],
    }));

    return NextResponse.json(formattedMembers);
  } catch (error) {
    console.error('Error fetching group members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}