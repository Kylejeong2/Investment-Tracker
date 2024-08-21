import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $groups, $groupMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const groupId = params.groupId;

  try {
    // Delete group members first
    await db.delete($groupMembers).where(eq($groupMembers.groupId, groupId));

    // Then delete the group
    await db.delete($groups).where(eq($groups.id, groupId));

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}