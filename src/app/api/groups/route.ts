import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $groups } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';

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

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function generateInviteLink() {
  // Implement invite link generation logic
  return 'some-unique-invite-link';
}