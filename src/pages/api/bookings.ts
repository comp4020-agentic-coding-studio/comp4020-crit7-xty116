import type { APIRoute } from "astro";
import {
  dateInCanberra,
  minutesToTime,
  timeInCanberra,
  timeToMinutes,
} from "../../lib/booking";
import {
  BookingConflictError,
  createBooking,
  listBookings,
  RoomNotFoundError,
} from "../../lib/db";
import { bus } from "../../lib/events";

const wantsJson = (request: Request) =>
  request.headers.get("accept")?.includes("application/json") ?? false;

const messageResponse = (
  request: Request,
  redirect: (path: string, status?: 301 | 302 | 303 | 307 | 308) => Response,
  message: string,
  status: number,
  search: URLSearchParams,
) => {
  if (wantsJson(request)) return Response.json({ error: message }, { status });
  search.set("error", message);
  return redirect(`/?${search.toString()}#results`, 303);
};

export const GET: APIRoute = () => Response.json({ bookings: listBookings() });

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const roomId = Number(form.get("roomId"));
  const date = String(form.get("date") ?? "");
  const start = String(form.get("start") ?? "");
  const startMinutes = timeToMinutes(start);
  const duration = Number(form.get("duration"));
  const organiser = String(form.get("organiser") ?? "").trim().slice(0, 60);
  const purpose = String(form.get("purpose") ?? "").trim().slice(0, 80);
  const search = new URLSearchParams({
    date,
    start,
    duration: String(duration),
    capacity: String(form.get("capacity") ?? "1"),
    sort: String(form.get("sort") ?? "best"),
  });
  for (const feature of form.getAll("features")) search.append("features", String(feature));
  if (form.get("availableOnly") === "true") search.set("availableOnly", "true");

  if (!Number.isInteger(roomId) || roomId < 1) {
    return messageResponse(request, redirect, "Choose a valid room.", 400, search);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < dateInCanberra()) {
    return messageResponse(request, redirect, "Choose today or a future date.", 400, search);
  }
  if (date === dateInCanberra() && startMinutes !== null && startMinutes <= timeInCanberra()) {
    return messageResponse(request, redirect, "Choose a time that has not already passed.", 400, search);
  }
  if (
    startMinutes === null ||
    startMinutes < 8 * 60 ||
    ![30, 60, 90, 120, 180].includes(duration) ||
    startMinutes + duration > 22 * 60
  ) {
    return messageResponse(
      request,
      redirect,
      "Bookings must sit between 8:00 am and 10:00 pm.",
      400,
      search,
    );
  }
  if (organiser.length < 2 || purpose.length < 2) {
    return messageResponse(
      request,
      redirect,
      "Add your name and a short purpose for the room.",
      400,
      search,
    );
  }

  try {
    const booking = createBooking({
      roomId,
      date,
      startMinutes,
      endMinutes: startMinutes + duration,
      organiser,
      purpose,
    });
    bus.emit("booking", { type: "created", bookingId: booking.id });
    if (wantsJson(request)) return Response.json({ booking }, { status: 201 });
    search.set("notice", `${booking.room.name} booked until ${minutesToTime(booking.endMinutes)}.`);
    return redirect(`/?${search.toString()}#bookings`, 303);
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return messageResponse(request, redirect, error.message, 409, search);
    }
    if (error instanceof RoomNotFoundError) {
      return messageResponse(request, redirect, error.message, 404, search);
    }
    throw error;
  }
};
