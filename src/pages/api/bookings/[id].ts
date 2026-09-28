import type { APIRoute } from "astro";
import { cancelBooking } from "../../../lib/db";
import { bus } from "../../../lib/events";

function remove(idValue: string | undefined): Response | null {
  const id = Number(idValue);
  if (!Number.isInteger(id) || id < 1) {
    return Response.json({ error: "Invalid booking id." }, { status: 400 });
  }
  const booking = cancelBooking(id);
  if (!booking) return Response.json({ error: "Booking not found." }, { status: 404 });
  bus.emit("booking", { type: "cancelled", bookingId: id });
  return null;
}

export const DELETE: APIRoute = ({ params }) => {
  const error = remove(params.id);
  return error ?? Response.json({ ok: true });
};

export const POST: APIRoute = ({ params, redirect }) => {
  const error = remove(params.id);
  if (error) return redirect("/?error=That+booking+could+not+be+cancelled.#bookings", 303);
  return redirect("/?notice=Booking+cancelled.#bookings", 303);
};
