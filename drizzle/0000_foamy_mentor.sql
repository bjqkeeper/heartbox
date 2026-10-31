CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`owner_id` text NOT NULL,
	`invite_code` text NOT NULL,
	`release_kind` text DEFAULT 'nightly' NOT NULL,
	`release_hour` integer DEFAULT 21 NOT NULL,
	`release_weekday` integer DEFAULT 0 NOT NULL,
	`settlement_kind` text DEFAULT 'weekly' NOT NULL,
	`score_agree` integer DEFAULT 3 NOT NULL,
	`score_neutral` integer DEFAULT 1 NOT NULL,
	`score_disagree` integer DEFAULT 0 NOT NULL,
	`anonymous` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `groups_invite_code_unique` ON `groups` (`invite_code`);--> statement-breakpoint
CREATE TABLE `letters` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`unlock_at` integer NOT NULL,
	`score_agree` integer NOT NULL,
	`score_neutral` integer NOT NULL,
	`score_disagree` integer NOT NULL,
	`response` text,
	`score_awarded` integer,
	`responded_at` integer,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`group_id`, `user_id`),
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE no action
);
