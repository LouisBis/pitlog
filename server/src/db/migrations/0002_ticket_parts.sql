CREATE TABLE `ticket_parts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_id` integer NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`reference` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`url` text,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
