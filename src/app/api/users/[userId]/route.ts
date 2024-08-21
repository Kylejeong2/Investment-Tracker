import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  try {
    const [user] = await db.select().from($users).where(eq($users.id, userId));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userWithLocation = {
      ...user,
      location: [user.longitude, user.latitude]
    };

    return NextResponse.json(userWithLocation);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}