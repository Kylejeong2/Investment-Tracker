import { pgTable, uuid, text, timestamp, numeric } from 'drizzle-orm/pg-core';

export const $groups = pgTable('groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  leaderId: text('leader_id').notNull(),
  inviteLink: text('invite_link').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const $groupMembers = pgTable('group_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id').references(() => $groups.id),
  userId: text('user_id').notNull(),
  joinedAt: timestamp('joined_at').defaultNow(),
});

export const $users = pgTable('users', {
  id: text('id').primaryKey(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').notNull(),
  profilePicture: text('profile_picture').notNull(),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type GroupType = typeof $groups.$inferInsert;
export type GroupMemberType = typeof $groupMembers.$inferInsert;