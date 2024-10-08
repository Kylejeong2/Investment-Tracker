import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $groups, $groupMembers, $users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inviteCode = searchParams.get('inviteCode');

  if (!inviteCode) {
    return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
  }

  try {
    const [group] = await db.select().from($groups).where(eq($groups.inviteLink, inviteCode));

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ groupName: group.name });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { inviteCode } = await request.json();

  try {
    // Find the group by invite link
    const [group] = await db.select().from($groups).where(eq($groups.inviteLink, inviteCode));

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if the user is already a member of the group
    const [existingMember] = await db
      .select()
      .from($groupMembers)
      .where(
        and(
          eq($groupMembers.groupId, group.id),
          eq($groupMembers.userId, userId)
        )
      );

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 400 });
    }

    // Add the user to the group
    await db.insert($groupMembers).values({ groupId: group.id, userId });

    return NextResponse.json({ success: true, groupId: group.id });
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}