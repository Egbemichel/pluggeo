-- Custom SQL migration file, put your code below! --
ALTER TABLE "product_images" RENAME TO "product_media";--> statement-breakpoint
ALTER TABLE "product_media" ADD COLUMN "type" text DEFAULT 'image' NOT NULL;