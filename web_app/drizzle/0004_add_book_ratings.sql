CREATE TABLE `book_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`book_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`review` text,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "rating_range" CHECK("book_ratings"."rating" >= 1 AND "book_ratings"."rating" <= 10)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `book_ratings_book_id_unique` ON `book_ratings` (`book_id`);--> statement-breakpoint
ALTER TABLE `books` ADD `bookmark` integer DEFAULT 0;