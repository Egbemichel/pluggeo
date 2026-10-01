CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"is_crypto" boolean DEFAULT false NOT NULL,
	"require_proof" boolean DEFAULT false NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"customer_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"wallets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_methods_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_details" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_discount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_proof_url" text;--> statement-breakpoint
CREATE INDEX "payment_methods_enabled_order_idx" ON "payment_methods" USING btree ("enabled","sort_order");
--> statement-breakpoint
INSERT INTO "payment_methods" ("name", "slug", "description", "instructions", "enabled", "is_crypto", "require_proof", "discount_percent", "customer_fields", "wallets", "sort_order") VALUES
	('Card', 'card', 'We will send you a secure card payment link after reviewing your order.', 'Never send card numbers, expiration dates, or security codes in this form. We will contact you with a secure payment link.', true, false, false, '0', '[]'::jsonb, '[]'::jsonb, 0),
	('Bank transfer', 'bank-transfer', 'Receive bank transfer instructions after we confirm your order.', 'We will contact you with verified bank transfer instructions. Do not enter bank login credentials here.', true, false, false, '0', '[]'::jsonb, '[]'::jsonb, 1),
	('Chime', 'chime', 'We will contact you to coordinate a Chime Pay Anyone transfer.', 'We will confirm the payment details with you on WhatsApp. Never share your Chime password or one-time security codes.', true, false, false, '0', '[{"key":"chime_contact","label":"Phone, email, or $ChimeSign for Chime Pay Anyone","required":true,"placeholder":"Phone, email, or $ChimeSign"}]'::jsonb, '[]'::jsonb, 2),
	('Apple Pay', 'apple-pay', 'We will contact you with Apple Pay or Apple Cash payment instructions.', 'Apple Pay checkout is not processed on this website. We will confirm the right payment instructions with you after receiving your order.', true, false, false, '0', '[{"key":"apple_pay_contact","label":"Phone or email for payment instructions","required":true,"placeholder":"Phone or email"}]'::jsonb, '[]'::jsonb, 3),
	('Cash App', 'cash-app', 'We will contact you to coordinate a Cash App payment.', 'We will confirm the payment details with you on WhatsApp. Never share your Cash App sign-in code or password.', true, false, false, '0', '[{"key":"cash_tag","label":"Your $Cashtag","required":true,"placeholder":"$Cashtag"}]'::jsonb, '[]'::jsonb, 4),
	('Crypto', 'crypto', 'Pay with crypto on Polygon and receive 10% off your merchandise subtotal.', 'The supported token has not been configured yet. Do not send funds until we confirm the accepted token and exact amount.', true, true, true, '10', '[]'::jsonb, '[{"id":"polygon-wallet","name":"Polygon wallet","network":"Polygon","address":"0xA96097ADae24bdaad284Fa3E555e798CFEeEBaF4","asset":""}]'::jsonb, 5),
	('Other', 'other', 'Tell us which payment method you prefer and we will follow up.', 'We will contact you on WhatsApp to confirm an available payment option.', true, false, false, '0', '[{"key":"payment_note","label":"Preferred payment method or note","required":false,"placeholder":"Tell us what works for you"}]'::jsonb, '[]'::jsonb, 6);