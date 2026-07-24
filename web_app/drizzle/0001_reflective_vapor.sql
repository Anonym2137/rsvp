PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_book_contents` (
	`book_id` integer NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_book_contents`("book_id", "content") SELECT "book_id", "content" FROM `book_contents`;--> statement-breakpoint
DROP TABLE `book_contents`;--> statement-breakpoint
ALTER TABLE `__new_book_contents` RENAME TO `book_contents`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_reading_session` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`book_id` integer NOT NULL,
	`duration_seconds` integer NOT NULL,
	`wpm` integer NOT NULL,
	`words_read` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_reading_session`("id", "book_id", "duration_seconds", "wpm", "words_read", "created_at") SELECT "id", "book_id", "duration_seconds", "wpm", "words_read", "created_at" FROM `reading_session`;--> statement-breakpoint
DROP TABLE `reading_session`;--> statement-breakpoint
ALTER TABLE `__new_reading_session` RENAME TO `reading_session`;--> statement-breakpoint
CREATE TABLE `__new_user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`current_book_id` integer,
	`show_fixation` integer DEFAULT true,
	`reading_speed` integer DEFAULT 300 NOT NULL,
	FOREIGN KEY (`current_book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_settings`("id", "current_book_id", "show_fixation", "reading_speed") SELECT "id", "current_book_id", "show_fixation", "reading_speed" FROM `user_settings`;--> statement-breakpoint
DROP TABLE `user_settings`;--> statement-breakpoint
ALTER TABLE `__new_user_settings` RENAME TO `user_settings`;