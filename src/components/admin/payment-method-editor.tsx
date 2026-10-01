"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { deletePaymentMethod, savePaymentMethod } from "@/app/pluggeo/payments/actions";
import type { PaymentMethodInput } from "@/lib/payment-method-schema";

const inputClass = "w-full rounded-sm border border-border bg-background px-3 py-2 text-body-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass = "rounded-sm bg-primary px-4 py-2 text-body-sm text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
const checkClass = "size-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type SavedMethod = PaymentMethodInput & { id: string };

const blankMethod: PaymentMethodInput = {
  name: "",
  slug: "",
  description: "",
  instructions: "",
  enabled: true,
  isCrypto: false,
  requireProof: false,
  discountPercent: 0,
  customerFields: [],
  wallets: [],
  sortOrder: 0,
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={id} className="grid gap-1.5 text-body-sm">
      <span>{label}</span>
      <input
        id={id}
        className={inputClass}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function PaymentMethodEditor({ method }: { method?: SavedMethod }) {
  const router = useRouter();
  const [config, setConfig] = useState<PaymentMethodInput>(method ?? blankMethod);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const formId = method?.id ?? "new-payment-method";

  function update<K extends keyof PaymentMethodInput>(key: K, value: PaymentMethodInput[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function addCustomerField() {
    const key = `field_${config.customerFields.length + 1}`;
    update("customerFields", [
      ...config.customerFields,
      { key, label: "New customer detail", required: false, placeholder: "" },
    ]);
  }

  function addWallet() {
    update("wallets", [
      ...config.wallets,
      {
        id: `wallet-${crypto.randomUUID()}`,
        name: "New wallet",
        network: "",
        address: "",
        asset: "",
      },
    ]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = await savePaymentMethod(method?.id ?? null, config);
    setBusy(false);
    setMessage(result.success ? "Payment method saved." : result.error);
    if (result.success) router.refresh();
  }

  async function removeMethod() {
    if (!method || !window.confirm(`Delete ${method.name}? Existing order records will remain.`)) return;
    setBusy(true);
    const result = await deletePaymentMethod(method.id);
    setBusy(false);
    setMessage(result.success ? "Payment method deleted." : result.error);
    if (result.success) router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6 border border-border bg-card p-5 text-card-foreground md:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={`${formId}-name`}
          label="Method name"
          value={config.name}
          required
          onChange={(name) => {
            setConfig((current) => ({
              ...current,
              name,
              slug: method ? current.slug : toSlug(name),
            }));
          }}
        />
        <TextField
          id={`${formId}-slug`}
          label="Method ID"
          value={config.slug}
          required
          onChange={(slug) => update("slug", slug)}
        />
        <TextField
          id={`${formId}-description`}
          label="Customer-facing description"
          value={config.description}
          onChange={(description) => update("description", description)}
        />
        <TextField
          id={`${formId}-sort-order`}
          label="Display order"
          value={config.sortOrder}
          type="number"
          onChange={(value) => update("sortOrder", Number(value))}
        />
      </div>

      <label htmlFor={`${formId}-instructions`} className="grid gap-1.5 text-body-sm">
        <span>Customer instructions shown at checkout</span>
        <textarea
          id={`${formId}-instructions`}
          className={`${inputClass} min-h-24 resize-y`}
          value={config.instructions}
          maxLength={2000}
          onChange={(event) => update("instructions", event.target.value)}
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="mb-3 text-h6 font-medium">Method settings</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-body-sm">
            <input className={checkClass} type="checkbox" checked={config.enabled} onChange={(event) => update("enabled", event.target.checked)} />
            Available at checkout
          </label>
          <label className="flex items-center gap-2 text-body-sm">
            <input className={checkClass} type="checkbox" checked={config.isCrypto} onChange={(event) => update("isCrypto", event.target.checked)} />
            Crypto payment
          </label>
          <label className="flex items-center gap-2 text-body-sm">
            <input className={checkClass} type="checkbox" checked={config.requireProof} onChange={(event) => update("requireProof", event.target.checked)} />
            Require payment screenshot
          </label>
        </div>
        {config.isCrypto && (
          <div className="max-w-xs">
            <TextField
              id={`${formId}-discount`}
              label="Merchandise discount (%)"
              value={config.discountPercent}
              type="number"
              onChange={(value) => update("discountPercent", Number(value))}
            />
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <legend className="text-h6 font-medium">Customer details to collect</legend>
          <button type="button" className="rounded-sm border border-border px-3 py-1.5 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={addCustomerField}>
            Add detail
          </button>
        </div>
        {config.customerFields.map((field, index) => (
          <div key={`${field.key}-${index}`} className="grid gap-3 border-t border-border pt-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
            <TextField
              id={`${formId}-field-key-${index}`}
              label="Field ID"
              value={field.key}
              onChange={(key) => update("customerFields", config.customerFields.map((item, i) => i === index ? { ...item, key } : item))}
            />
            <TextField
              id={`${formId}-field-label-${index}`}
              label="Customer label"
              value={field.label}
              onChange={(label) => update("customerFields", config.customerFields.map((item, i) => i === index ? { ...item, label } : item))}
            />
            <label className="flex items-center gap-2 py-2 text-body-sm">
              <input className={checkClass} type="checkbox" checked={field.required} onChange={(event) => update("customerFields", config.customerFields.map((item, i) => i === index ? { ...item, required: event.target.checked } : item))} />
              Required
            </label>
            <button type="button" className="rounded-sm border border-border px-3 py-2 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => update("customerFields", config.customerFields.filter((_, i) => i !== index))}>
              Remove
            </button>
            <div className="sm:col-span-2">
              <TextField
                id={`${formId}-field-placeholder-${index}`}
                label="Placeholder"
                value={field.placeholder ?? ""}
                onChange={(placeholder) => update("customerFields", config.customerFields.map((item, i) => i === index ? { ...item, placeholder } : item))}
              />
            </div>
          </div>
        ))}
      </fieldset>

      {config.isCrypto && (
        <fieldset className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <legend className="text-h6 font-medium">Accepted wallets</legend>
            <button type="button" className="rounded-sm border border-border px-3 py-1.5 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={addWallet}>
              Add wallet
            </button>
          </div>
          {config.wallets.map((wallet, index) => (
            <div key={`${wallet.id}-${index}`} className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
              <TextField id={`${formId}-wallet-name-${index}`} label="Wallet label" value={wallet.name} onChange={(name) => update("wallets", config.wallets.map((item, i) => i === index ? { ...item, name } : item))} />
              <TextField id={`${formId}-wallet-network-${index}`} label="Network" value={wallet.network} onChange={(network) => update("wallets", config.wallets.map((item, i) => i === index ? { ...item, network } : item))} />
              <TextField id={`${formId}-wallet-asset-${index}`} label="Accepted asset/token" value={wallet.asset ?? ""} onChange={(asset) => update("wallets", config.wallets.map((item, i) => i === index ? { ...item, asset } : item))} />
              <TextField id={`${formId}-wallet-id-${index}`} label="Wallet ID" value={wallet.id} onChange={(id) => update("wallets", config.wallets.map((item, i) => i === index ? { ...item, id } : item))} />
              <div className="sm:col-span-2">
                <TextField id={`${formId}-wallet-address-${index}`} label="Wallet address" value={wallet.address} onChange={(address) => update("wallets", config.wallets.map((item, i) => i === index ? { ...item, address } : item))} />
              </div>
              <button type="button" className="justify-self-start rounded-sm border border-border px-3 py-2 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => update("wallets", config.wallets.filter((_, i) => i !== index))}>
                Remove wallet
              </button>
            </div>
          ))}
          {config.wallets.some((wallet) => !wallet.asset?.trim()) && (
            <p className="text-body-sm text-text-secondary">Set the accepted token for every wallet before customers send crypto.</p>
          )}
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button className={buttonClass} type="submit" disabled={busy}>
          {busy ? "Saving..." : method ? "Save payment method" : "Add payment method"}
        </button>
        {method && (
          <button className="rounded-sm border border-destructive px-4 py-2 text-body-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" type="button" disabled={busy} onClick={() => void removeMethod()}>
            Delete method
          </button>
        )}
        <p role="status" aria-live="polite" className="text-body-sm text-text-secondary">{message}</p>
      </div>
    </form>
  );
}
