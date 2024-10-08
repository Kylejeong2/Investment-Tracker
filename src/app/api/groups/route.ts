import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $groups, $groupMembers } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, leaderId } = await request.json();

  console.log('Creating group. User ID:', userId, 'Leader ID:', leaderId); // Debug log

  if (userId !== leaderId) {
    return NextResponse.json({ error: 'Unauthorized: User ID does not match Leader ID' }, { status: 403 });
  }

  try {
    const [newGroup] = await db.insert($groups).values({
      name,
      leaderId,
      inviteLink: generateInviteLink(), // Implement this function
    }).returning();

    console.log('New group created:', newGroup); // Debug log

    // Add the user as a group member
    await db.insert($groupMembers).values({
      groupId: newGroup.id,
      userId: leaderId,
    });

    console.log('Leader added as group member:', leaderId); // Debug log

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function generateInviteLink(): string {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return randomBytes;
}