import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $groupMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const { userId } = auth();
  const groupId = params.groupId;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await db.delete($groupMembers)
      .where(
        and(
          eq($groupMembers.groupId, groupId),
          eq($groupMembers.userId, userId)
        )
      );

    return NextResponse.json({ message: 'Successfully left the group' });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}