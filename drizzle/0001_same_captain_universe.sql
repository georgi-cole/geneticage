CREATE TABLE `report_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`assessment_id` text NOT NULL,
	`live_mode` integer NOT NULL,
	`price_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`session_id` text,
	`payment_intent_id` text,
	`created_at` text NOT NULL,
	`checked_at` text,
	`paid_at` text,
	`receipt_url` text,
	`verify_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `report_orders_session` ON `report_orders` (`session_id`);--> statement-breakpoint
CREATE INDEX `report_orders_owner` ON `report_orders` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `report_orders_intent` ON `report_orders` (`payment_intent_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `report_orders_active` ON `report_orders` (`user_id`,`assessment_id`,`live_mode`) WHERE "report_orders"."status" IN ('creating','open','processing','paid');