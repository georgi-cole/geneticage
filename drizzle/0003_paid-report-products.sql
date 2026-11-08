CREATE TABLE `specialist_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`assessment_id` text NOT NULL,
	`created_at` text NOT NULL,
	`status` text NOT NULL,
	`consent_version` text NOT NULL,
	`country` text NOT NULL,
	`language` text NOT NULL,
	`request` text NOT NULL,
	`reviewer_user_id` text,
	`quote` text,
	`quote_amount` integer,
	`quote_currency` text,
	`quote_expires_at` text,
	`quoted_at` text,
	`delivery` text,
	`delivered_at` text,
	`closed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `specialist_reviews_owner` ON `specialist_reviews` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `specialist_reviews_queue` ON `specialist_reviews` (`status`,`country`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `specialist_reviews_active` ON `specialist_reviews` (`user_id`,`assessment_id`) WHERE "specialist_reviews"."status" IN ('requested','quoted','delivered');--> statement-breakpoint
DROP INDEX `report_orders_active`;--> statement-breakpoint
ALTER TABLE `report_orders` ADD `review_request_id` text REFERENCES specialist_reviews(id) ON DELETE CASCADE;--> statement-breakpoint
CREATE UNIQUE INDEX `report_orders_review_active` ON `report_orders` (`review_request_id`,`live_mode`) WHERE "report_orders"."review_request_id" IS NOT NULL AND "report_orders"."status" IN ('creating','open','processing','paid');--> statement-breakpoint
CREATE UNIQUE INDEX `report_orders_active` ON `report_orders` (`user_id`,`assessment_id`,`live_mode`) WHERE "report_orders"."review_request_id" IS NULL AND "report_orders"."status" IN ('creating','open','processing','paid');
