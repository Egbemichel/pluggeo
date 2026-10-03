ALTER TABLE "orders" ADD COLUMN "invoice_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoice_issued_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "owner_notified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_confirmed_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_invoice_number_unique" ON "orders" USING btree ("invoice_number");