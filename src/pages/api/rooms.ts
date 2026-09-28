import type { APIRoute } from "astro";
import { parseCriteria } from "../../lib/booking";
import { listRooms } from "../../lib/db";

export const GET: APIRoute = ({ url }) => {
  const criteria = parseCriteria(url.searchParams);
  const rooms = listRooms(criteria);
  return Response.json({ criteria, rooms });
};
