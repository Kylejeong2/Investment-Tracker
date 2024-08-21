import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $groups, $groupMembers } from '@/lib/db/schema';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

function generateInviteLink(): string {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now().toString(36);
  return `${randomBytes}${timestamp}`;
}

export async function POST(request: Request) {
  const { name, userId } = await request.json();

  const [newGroup] = await db.insert($groups).values({
    name,
    leaderId: userId,
    inviteLink: generateInviteLink()
  }).returning();

  await db.insert($groupMembers).values({ groupId: newGroup.id, userId });

  return NextResponse.json(newGroup);
}

export async function DELETE(request: Request) {
  const { groupId } = await request.json();

  await db.delete($groupMembers).where(eq($groupMembers.groupId, groupId));
  await db.delete($groups).where(eq($groups.id, groupId));

  return NextResponse.json({ success: true });
}