CREATE TABLE `motorcycles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`year` integer NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `intervals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`motorcycle_id` integer NOT NULL,
	`operation` text NOT NULL,
	`interval_km` integer,
	`interval_days` integer,
	FOREIGN KEY (`motorcycle_id`) REFERENCES `motorcycles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_motorcycles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`motorcycle_id` integer NOT NULL,
	`current_km` integer DEFAULT 0 NOT NULL,
	`acquired_at` integer NOT NULL,
	FOREIGN KEY (`motorcycle_id`) REFERENCES `motorcycles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `km_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_motorcycle_id` integer NOT NULL,
	`km` integer NOT NULL,
	`recorded_at` integer NOT NULL,
	FOREIGN KEY (`user_motorcycle_id`) REFERENCES `user_motorcycles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_motorcycle_id` integer NOT NULL,
	`interval_id` integer,
	`operation` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`target_km` integer,
	`target_date` integer,
	`done_km` integer,
	`done_at` integer,
	FOREIGN KEY (`user_motorcycle_id`) REFERENCES `user_motorcycles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`interval_id`) REFERENCES `intervals`(`id`) ON UPDATE no action ON DELETE no action
);
