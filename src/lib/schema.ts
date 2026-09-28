import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const rooms = sqliteTable("rooms", {
  id: int().primaryKey(),
  name: text().notNull(),
  building: text().notNull(),
  level: text().notNull(),
  capacity: int().notNull(),
  features: text().notNull(),
  walkMinutes: int("walk_minutes").notNull(),
  note: text().notNull(),
});

export const bookings = sqliteTable("bookings", {
  id: int().primaryKey({ autoIncrement: true }),
  roomId: int("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  date: text().notNull(),
  startMinutes: int("start_minutes").notNull(),
  endMinutes: int("end_minutes").notNull(),
  organiser: text().notNull(),
  purpose: text().notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Room = typeof rooms.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
