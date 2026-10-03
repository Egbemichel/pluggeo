CREATE TABLE "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" text NOT NULL,
	"path" text NOT NULL,
	"product_slug" text,
	"referrer_host" text,
	"country" text,
	"device" text DEFAULT 'desktop' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "page_views_created_at_idx" ON "page_views" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "page_views_visitor_idx" ON "page_views" USING btree ("visitor_id");