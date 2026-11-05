CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`model_version` text NOT NULL,
	`payload` text NOT NULL,
	`report` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assessments_owner_created` ON `assessments` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `mutation_limits` (
	`user_id` text PRIMARY KEY NOT NULL,
	`bucket` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`consent_version` text NOT NULL,
	`consent_at` text NOT NULL,
	`created_at` text NOT NULL
);
