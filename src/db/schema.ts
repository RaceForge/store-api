import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const leads = sqliteTable('leads', {
  id: integer('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  status: text('status'),
  confirmedAt: integer('confirmed_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});