import type { APIRoute } from "astro";
import { bus } from "../../lib/events";

type BookingEvent = { type: "created" | "cancelled"; bookingId: number };

export const GET: APIRoute = () => {
  let onBooking: (event: BookingEvent) => void;
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue(": connected\n\n");
      heartbeat = setInterval(() => controller.enqueue(": ping\n\n"), 30_000);
      onBooking = (event) => {
        controller.enqueue(`event: booking\ndata: ${JSON.stringify(event)}\n\n`);
      };
      bus.on("booking", onBooking);
    },
    cancel() {
      clearInterval(heartbeat);
      bus.off("booking", onBooking);
    },
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    },
  });
};
