import { PaymentMethodEditor } from "@/components/admin/payment-method-editor";
import { getAdminPaymentMethods } from "./actions";

export const dynamic = "force-dynamic";

export default async function PaymentSettingsPage() {
  const methods = await getAdminPaymentMethods();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-h3 font-heading">Payment settings</h1>
        <p className="max-w-3xl text-body-sm text-text-secondary">
          Manage customer payment choices, requested details, instructions, crypto wallets, discounts, and screenshot requirements. Never request card numbers, bank passwords, or one-time codes here.
        </p>
      </header>

      <section aria-label="Payment methods" className="space-y-4">
        {methods.map((method) => (
          <PaymentMethodEditor
            key={method.id}
            method={{
              id: method.id,
              name: method.name,
              slug: method.slug,
              description: method.description,
              instructions: method.instructions,
              enabled: method.enabled,
              isCrypto: method.isCrypto,
              requireProof: method.requireProof,
              discountPercent: Number(method.discountPercent),
              customerFields: method.customerFields,
              wallets: method.wallets,
              sortOrder: method.sortOrder,
            }}
          />
        ))}
      </section>

      <section aria-label="Add payment method">
        <PaymentMethodEditor />
      </section>
    </div>
  );
}
