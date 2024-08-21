import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { $users } from '@/lib/db/schema';

export async function POST(request: Request) {
  const userData = await request.json();

  try {
    const [user] = await db.insert($users).values({
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profilePicture: userData.profilePicture,
      longitude: userData.longitude,
      latitude: userData.latitude,
    }).onConflictDoUpdate({
      target: $users.id,
      set: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profilePicture: userData.profilePicture,
        longitude: userData.longitude,
        latitude: userData.latitude,
      }
    }).returning();

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating or updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}