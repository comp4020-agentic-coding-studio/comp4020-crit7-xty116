CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` integer NOT NULL,
	`date` text NOT NULL,
	`start_minutes` integer NOT NULL,
	`end_minutes` integer NOT NULL,
	`organiser` text NOT NULL,
	`purpose` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`building` text NOT NULL,
	`level` text NOT NULL,
	`capacity` integer NOT NULL,
	`features` text NOT NULL,
	`walk_minutes` integer NOT NULL,
	`note` text NOT NULL
);
--> statement-breakpoint
DROP TABLE `messages`;