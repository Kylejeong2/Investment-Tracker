import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $groups } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const groupId = params.groupId;

  try {
    const [group] = await db.select().from($groups).where(eq($groups.id, groupId));

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ inviteLink: group.inviteLink });
  } catch (error) {
    console.error('Error fetching invite link:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}