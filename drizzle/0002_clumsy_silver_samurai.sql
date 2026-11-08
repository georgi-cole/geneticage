CREATE TABLE `auth_accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_accounts_email` ON `auth_accounts` (`email`);--> statement-breakpoint
CREATE TABLE `auth_rate_limits` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`bucket` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `auth_sessions_owner` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `auth_sessions_expiry` ON `auth_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `email_auth_codes` (
	`email` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`verified_at` integer,
	`proof_hash` text,
	`proof_expires_at` integer,
	`created_at` integer NOT NULL
);
