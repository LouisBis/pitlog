CREATE TABLE `motorcycle_intervals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_motorcycle_id` integer NOT NULL,
	`interval_id` integer NOT NULL,
	`custom_km` integer,
	`custom_days` integer,
	FOREIGN KEY (`user_motorcycle_id`) REFERENCES `user_motorcycles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`interval_id`) REFERENCES `intervals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `motorcycle_intervals_user_motorcycle_id_interval_id_unique` ON `motorcycle_intervals` (`user_motorcycle_id`,`interval_id`);