CREATE TABLE `challenge_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`gender` text NOT NULL,
	`score` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `challenge_entries_score_idx` ON `challenge_entries` (`score`);--> statement-breakpoint
CREATE INDEX `challenge_entries_name_idx` ON `challenge_entries` (`name`);--> statement-breakpoint
CREATE INDEX `challenge_entries_gender_idx` ON `challenge_entries` (`gender`);