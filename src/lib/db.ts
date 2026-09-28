import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, asc, eq, gt, gte, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { Facility, RoomSort } from "./booking";
import { type Booking, bookings, type Room, rooms } from "./schema";

const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");
client.pragma("foreign_keys = ON");

export const db = drizzle(client);
migrate(db, { migrationsFolder: "./drizzle" });

const ROOM_SEEDS: Room[] = [
  {
    id: 1,
    name: "Hanna Neumann 145",
    building: "Hanna Neumann Building #145",
    level: "Ground floor",
    capacity: 8,
    features: JSON.stringify(["whiteboard", "accessible", "quiet"]),
    walkMinutes: 4,
    note: "Small, focused room beside the computing precinct.",
  },
  {
    id: 2,
    name: "Marie Reay 3.02",
    building: "Marie Reay Teaching Centre #155",
    level: "Level 3",
    capacity: 12,
    features: JSON.stringify(["display", "whiteboard", "accessible"]),
    walkMinutes: 6,
    note: "Flexible table layout for project meetings and tutorials.",
  },
  {
    id: 3,
    name: "Kambri 2.21",
    building: "Kambri Cultural Centre #153",
    level: "Level 2",
    capacity: 24,
    features: JSON.stringify(["display", "whiteboard", "accessible", "video"]),
    walkMinutes: 7,
    note: "Hybrid-ready collaboration room near the centre of campus.",
  },
  {
    id: 4,
    name: "Hancock 2.13",
    building: "Hancock Library #43",
    level: "Level 2",
    capacity: 6,
    features: JSON.stringify(["whiteboard", "quiet"]),
    walkMinutes: 9,
    note: "Quiet discussion room suited to close reading and revision.",
  },
  {
    id: 5,
    name: "Birch 1.08",
    building: "Birch Building #35",
    level: "Level 1",
    capacity: 16,
    features: JSON.stringify(["display", "whiteboard", "accessible", "video"]),
    walkMinutes: 11,
    note: "A medium seminar room with presentation and call facilities.",
  },
  {
    id: 6,
    name: "Chifley 4.09",
    building: "Chifley Library #15",
    level: "Level 4",
    capacity: 4,
    features: JSON.stringify(["display", "quiet", "accessible"]),
    walkMinutes: 8,
    note: "Compact library room for interviews and pair work.",
  },
];

db.insert(rooms).values(ROOM_SEEDS).onConflictDoNothing().run();

export type RoomView = Omit<Room, "features"> & { features: Facility[] };
export type RoomResult = RoomView & {
  available: boolean;
  dayBookings: Booking[];
  nextAvailableStarts: number[];
};
export type BookingView = Booking & { room: RoomView };

export class BookingConflictError extends Error {}
export class RoomNotFoundError extends Error {}

function roomView(room: Room): RoomView {
  return { ...room, features: JSON.parse(room.features) as Facility[] };
}

export function listRooms(input: {
  date: string;
  startMinutes: number;
  duration: number;
  capacity: number;
  features: Facility[];
  sort: RoomSort;
  availableOnly: boolean;
}): RoomResult[] {
  const allRooms = db
    .select()
    .from(rooms)
    .where(gte(rooms.capacity, input.capacity))
    .orderBy(asc(rooms.walkMinutes), asc(rooms.capacity))
    .all();
  const dayBookings = db
    .select()
    .from(bookings)
    .where(eq(bookings.date, input.date))
    .orderBy(asc(bookings.startMinutes))
    .all();
  const requestedEnd = input.startMinutes + input.duration;

  const results = allRooms
    .map(roomView)
    .filter((room) => input.features.every((feature) => room.features.includes(feature)))
    .map((room) => {
      const roomBookings = dayBookings.filter((booking) => booking.roomId === room.id);
      const available = !roomBookings.some(
        (booking) =>
          booking.startMinutes < requestedEnd && booking.endMinutes > input.startMinutes,
      );
      const nextAvailableStarts: number[] = [];
      for (
        let start = input.startMinutes + 30;
        start + input.duration <= 22 * 60 && nextAvailableStarts.length < 2;
        start += 30
      ) {
        const end = start + input.duration;
        const overlaps = roomBookings.some(
          (booking) => booking.startMinutes < end && booking.endMinutes > start,
        );
        if (!overlaps) nextAvailableStarts.push(start);
      }
      return { ...room, available, dayBookings: roomBookings, nextAvailableStarts };
    });

  const filtered = input.availableOnly
    ? results.filter((room) => room.available)
    : results;
  return filtered.sort((a, b) => {
    if (input.sort === "capacity") return b.capacity - a.capacity || a.walkMinutes - b.walkMinutes;
    if (input.sort === "walk") return a.walkMinutes - b.walkMinutes || a.capacity - b.capacity;
    return Number(b.available) - Number(a.available) || a.walkMinutes - b.walkMinutes;
  });
}

export function listBookings(): BookingView[] {
  return db
    .select({ booking: bookings, room: rooms })
    .from(bookings)
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .orderBy(asc(bookings.date), asc(bookings.startMinutes))
    .limit(50)
    .all()
    .map(({ booking, room }) => ({ ...booking, room: roomView(room) }));
}

export function getBooking(id: number): BookingView | undefined {
  const result = db
    .select({ booking: bookings, room: rooms })
    .from(bookings)
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(eq(bookings.id, id))
    .get();
  return result ? { ...result.booking, room: roomView(result.room) } : undefined;
}

export function createBooking(input: {
  roomId: number;
  date: string;
  startMinutes: number;
  endMinutes: number;
  organiser: string;
  purpose: string;
}): BookingView {
  return db.transaction((tx) => {
    const room = tx.select().from(rooms).where(eq(rooms.id, input.roomId)).get();
    if (!room) throw new RoomNotFoundError("Room not found");

    const conflict = tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.roomId, input.roomId),
          eq(bookings.date, input.date),
          lt(bookings.startMinutes, input.endMinutes),
          gt(bookings.endMinutes, input.startMinutes),
        ),
      )
      .get();
    if (conflict) throw new BookingConflictError("This room is already booked then.");

    const booking = tx.insert(bookings).values(input).returning().get();
    return { ...booking, room: roomView(room) };
  });
}

export function cancelBooking(id: number): Booking | undefined {
  return db.delete(bookings).where(eq(bookings.id, id)).returning().get();
}

export type { Booking, Room };
