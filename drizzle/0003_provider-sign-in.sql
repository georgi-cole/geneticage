CREATE TABLE `oauth_accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`subject_hash` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_accounts_identity` ON `oauth_accounts` (`provider`,`subject_hash`);--> statement-breakpoint
CREATE TABLE `oauth_pending` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`expires_at` integer NOT NULL,
	`subject_hash` text
);
--> statement-breakpoint
CREATE INDEX `oauth_pending_expiry` ON `oauth_pending` (`expires_at`);