PRAGMA foreign_keys = OFF;
--> statement-breakpoint
ALTER TABLE `motorcycles` ADD COLUMN `catalog_slug` text;
--> statement-breakpoint
CREATE TABLE `custom_intervals` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `motorcycle_id` integer NOT NULL,
  `operation` text NOT NULL,
  `interval_km` integer,
  `interval_days` integer,
  FOREIGN KEY (`motorcycle_id`) REFERENCES `motorcycles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `interval_overrides` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_motorcycle_id` integer NOT NULL,
  `catalog_slug` text NOT NULL,
  `interval_slug` text NOT NULL,
  `custom_km` integer,
  `custom_days` integer,
  FOREIGN KEY (`user_motorcycle_id`) REFERENCES `user_motorcycles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `interval_overrides_unique` ON `interval_overrides` (`user_motorcycle_id`, `catalog_slug`, `interval_slug`);
--> statement-breakpoint
CREATE TABLE `tickets_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_motorcycle_id` integer NOT NULL,
  `catalog_slug` text,
  `interval_slug` text,
  `custom_interval_id` integer,
  `operation` text NOT NULL,
  `status` text NOT NULL DEFAULT 'todo',
  `target_km` integer,
  `target_date` integer,
  `done_km` integer,
  `done_at` integer,
  FOREIGN KEY (`user_motorcycle_id`) REFERENCES `user_motorcycles`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`custom_interval_id`) REFERENCES `custom_intervals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `tickets_new` (`id`, `user_motorcycle_id`, `operation`, `status`, `target_km`, `target_date`, `done_km`, `done_at`)
  SELECT `id`, `user_motorcycle_id`, `operation`, `status`, `target_km`, `target_date`, `done_km`, `done_at` FROM `tickets`;
--> statement-breakpoint
DROP TABLE `tickets`;
--> statement-breakpoint
ALTER TABLE `tickets_new` RENAME TO `tickets`;
--> statement-breakpoint
DROP TABLE `motorcycle_intervals`;
--> statement-breakpoint
DROP TABLE `intervals`;
--> statement-breakpoint
PRAGMA foreign_keys = ON;
