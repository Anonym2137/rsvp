CREATE TABLE `book_contents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`book_id` integer NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`cover` text DEFAULT '',
	`progress` integer DEFAULT 0,
	`word_index` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `reading_session` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`book_id` integer NOT NULL,
	`duration_seconds` integer,
	`wpm` integer,
	`words_read` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000),
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`show_fixation` integer DEFAULT true,
	`reading_speed` integer DEFAULT 300,
	`current_book_id` integer,
	FOREIGN KEY (`current_book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
