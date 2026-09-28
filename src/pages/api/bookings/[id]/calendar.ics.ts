import type { APIRoute } from "astro";
import { getBooking } from "../../../../lib/db";

const calendarTime = (date: string, minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${date.replaceAll("-", "")}T${String(hours).padStart(2, "0")}${String(mins).padStart(2, "0")}00`;
};

const escapeCalendar = (value: string) =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r?\n/g, "\\n");

export const GET: APIRoute = ({ params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return new Response("Invalid booking id.", { status: 400 });
  }
  const booking = getBooking(id);
  if (!booking) return new Response("Booking not found.", { status: 404 });

  const stamp = new Date().toISOString().replaceAll(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Roomline//ANU Room Finder Prototype//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:roomline-${booking.id}@comp4020-crit7-xty116.fly.dev`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Australia/Sydney:${calendarTime(booking.date, booking.startMinutes)}`,
    `DTEND;TZID=Australia/Sydney:${calendarTime(booking.date, booking.endMinutes)}`,
    `SUMMARY:${escapeCalendar(booking.purpose)}`,
    `LOCATION:${escapeCalendar(`${booking.room.name}, ${booking.room.building}`)}`,
    `DESCRIPTION:${escapeCalendar(`Booked by ${booking.organiser} through the Roomline prototype.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new Response(calendar, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="roomline-booking-${booking.id}.ics"`,
      "cache-control": "private, no-store",
    },
  });
};
