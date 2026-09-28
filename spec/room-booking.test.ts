import { describe, expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");

const formPost = (path: string, values: Record<string, string>) =>
  fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: {
      accept: "application/json",
      origin: baseUrl,
    },
    body: new URLSearchParams(values),
    redirect: "manual",
  });

describe("room booking contract", () => {
  const date = "2030-05-14";
  const label = `Contract review ${process.hrtime.bigint()}`;
  let roomId = 0;
  let bookingId = 0;

  it("returns rooms that satisfy capacity and facility filters", async () => {
    const response = await fetch(
      new URL(
        `/api/rooms?date=${date}&start=10:00&duration=60&capacity=12&features=display,accessible`,
        baseUrl,
      ),
    );
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.rooms.length).toBeGreaterThan(0);
    expect(
      payload.rooms.every(
        (room: { capacity: number; features: string[] }) =>
          room.capacity >= 12 &&
          room.features.includes("display") &&
          room.features.includes("accessible"),
      ),
    ).toBe(true);
    roomId = payload.rooms[0].id;
  });

  it("creates a booking and returns the persisted record", async () => {
    const response = await formPost("/api/bookings", {
      roomId: String(roomId),
      date,
      start: "10:00",
      duration: "60",
      organiser: "Studio marker",
      purpose: label,
    });
    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.booking.purpose).toBe(label);
    bookingId = payload.booking.id;

    const page = await fetch(baseUrl);
    expect(await page.text()).toContain(label);
  });

  it("rejects a partially overlapping booking", async () => {
    const response = await formPost("/api/bookings", {
      roomId: String(roomId),
      date,
      start: "10:30",
      duration: "60",
      organiser: "Another group",
      purpose: "Overlapping session",
    });
    expect(response.status).toBe(409);
    const payload = await response.json();
    expect(payload.error).toMatch(/already booked/i);
  });

  it("cancels the booking and removes it from a fresh page load", async () => {
    const response = await fetch(new URL(`/api/bookings/${bookingId}`, baseUrl), {
      method: "DELETE",
      headers: { accept: "application/json", origin: baseUrl },
    });
    expect(response.status).toBe(200);

    const page = await fetch(baseUrl);
    expect(await page.text()).not.toContain(label);
  });
});
