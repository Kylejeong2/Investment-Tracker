import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $groups } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { inviteLink: string } }
) {
  const inviteLink = params.inviteLink;

  try {
    const [group] = await db.select({
      id: $groups.id,
      name: $groups.name,
    }).from($groups).where(eq($groups.inviteLink, inviteLink));

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching group by invite link:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}