import { EventEmitter } from "node:events";

// One process, one bus: booking changes can notify every open tab. This fits
// the single-machine deployment fixed by fly.toml; SQLite remains the source
// of truth, and clients reload from it when an event arrives.
export const bus = new EventEmitter();
bus.setMaxListeners(0);
