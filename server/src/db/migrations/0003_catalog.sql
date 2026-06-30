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
ALTER TABLE `tickets` ADD COLUMN `catalog_slug` text;
--> statement-breakpoint
ALTER TABLE `tickets` ADD COLUMN `interval_slug` text;
--> statement-breakpoint
ALTER TABLE `tickets` ADD COLUMN `custom_interval_id` integer REFERENCES `custom_intervals`(`id`);
--> statement-breakpoint
ALTER TABLE `tickets` DROP COLUMN `interval_id`;
--> statement-breakpoint
DROP TABLE `motorcycle_intervals`;
--> statement-breakpoint
DROP TABLE `intervals`;
--> statement-breakpoint
PRAGMA foreign_keys = ON;
