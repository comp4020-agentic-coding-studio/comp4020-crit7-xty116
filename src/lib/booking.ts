export const FACILITIES = [
  { value: "display", label: "Large display" },
  { value: "whiteboard", label: "Whiteboard" },
  { value: "accessible", label: "Step-free access" },
  { value: "video", label: "Video call setup" },
  { value: "quiet", label: "Quiet zone" },
] as const;

export type Facility = (typeof FACILITIES)[number]["value"];

export type SearchCriteria = {
  date: string;
  start: string;
  startMinutes: number;
  duration: number;
  capacity: number;
  features: Facility[];
};

export function dateInCanberra(): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function timeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  const suffix = hours >= 12 ? "pm" : "am";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function parseCriteria(params: URLSearchParams): SearchCriteria {
  const rawDate = params.get("date") ?? dateInCanberra();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : dateInCanberra();
  const rawStart = params.get("start") ?? "10:00";
  const parsedStart = timeToMinutes(rawStart);
  const rawDuration = Number(params.get("duration") ?? 60);
  const duration = [30, 60, 90, 120, 180].includes(rawDuration) ? rawDuration : 60;
  const latestStart = 22 * 60 - duration;
  const startMinutes =
    parsedStart !== null && parsedStart >= 8 * 60 && parsedStart <= latestStart
      ? parsedStart
      : Math.min(10 * 60, latestStart);
  const rawCapacity = Number(params.get("capacity") ?? 4);
  const capacity = Number.isInteger(rawCapacity)
    ? Math.min(40, Math.max(1, rawCapacity))
    : 4;
  const requested = params
    .getAll("features")
    .flatMap((value) => value.split(","))
    .filter((value): value is Facility =>
      FACILITIES.some((facility) => facility.value === value),
    );

  return {
    date,
    start: minutesToTime(startMinutes),
    startMinutes,
    duration,
    capacity,
    features: [...new Set(requested)],
  };
}
