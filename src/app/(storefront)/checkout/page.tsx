"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { currency } from "@/components/product-card";
import { calculateManualPaymentDiscount } from "@/lib/manual-payment";

type PaymentMethodOption = {
  id: string;
  name: string;
  slug: string;
  description: string;
  instructions: string;
  isCrypto: boolean;
  requireProof: boolean;
  discountPercent: string;
  customerFields: Array<{
    key: string;
    label: string;
    required: boolean;
    placeholder?: string;
  }>;
  wallets: Array<{
    id: string;
    name: string;
    network: string;
    address: string;
    asset?: string;
  }>;
};

type OrderReceipt = {
  orderNumber: string;
  phone: string;
  total: number;
  currency: string;
  notificationSent: boolean;
};

type CartItem = {
  id: string;
  href: string;
  image?: { src: string; alt: string };
  title: string;
  category?: string;
  price: number;
  selectedOptions?: string[];
  quantity: number;
};

function readStoredCartItems(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem("pluggeo-cart");

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== "object") {
        return [];
      }

      const item = entry as {
        id?: unknown;
        href?: unknown;
        image?: unknown;
        title?: unknown;
        category?: unknown;
        price?: unknown;
        selectedOptions?: unknown;
        quantity?: unknown;
      };

      if (typeof item.id !== "string" && typeof item.id !== "number") {
        return [];
      }

      const quantity = Number(item.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return [];
      }

      const price = Number(item.price);
      const selectedOptions = Array.isArray(item.selectedOptions)
        ? item.selectedOptions.filter((option): option is string => typeof option === "string")
        : [];

      return [{
        id: String(item.id),
        href: typeof item.href === "string" ? item.href : "/product",
        image: typeof item.image === "object" && item.image && "src" in item.image && "alt" in item.image
          ? {
              src: String((item.image as { src?: unknown }).src ?? ""),
              alt: String((item.image as { alt?: unknown }).alt ?? "Product"),
            }
          : undefined,
        title: typeof item.title === "string" ? item.title : "Product",
        category: typeof item.category === "string" ? item.category : undefined,
        price: Number.isFinite(price) ? price : 0,
        selectedOptions,
        quantity,
      }];
    });
  } catch {
    return [];
  }
}

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  shippingLine1: string;
  shippingLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const emptyForm: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  shippingLine1: "",
  shippingLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
};

export default function CheckoutPage() {
  const [items] = useState<CartItem[]>(readStoredCartItems);

  const subtotal = items.reduce(
    (sum, item) => sum + (item.price ?? 0) * item.quantity,
    0,
  );

  const [form, setForm] =
    useState<CustomerForm>(
      emptyForm,
    );

  const [loading, setLoading] =
    useState(false);

  const [methods, setMethods] =
    useState<PaymentMethodOption[]>([]);

  const [selectedMethodId, setSelectedMethodId] =
    useState("");

  const [loadingMethods, setLoadingMethods] =
    useState(true);

  const [paymentDetails, setPaymentDetails] =
    useState<Record<string, string>>({});

  const [walletId, setWalletId] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofUploading, setProofUploading] = useState(false);
  const [proofError, setProofError] = useState("");
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

  const [error, setError] =
    useState("");

  const selectedMethod = methods.find(
    (method) => method.id === selectedMethodId,
  );
  const selectedWallet = selectedMethod?.wallets.find(
    (wallet) => wallet.id === walletId,
  );
  const discount = calculateManualPaymentDiscount(
    subtotal,
    selectedMethod?.isCrypto ?? false,
    Number(selectedMethod?.discountPercent ?? 0),
  );

  useEffect(() => {
    async function loadMethods() {
      try {
        const response =
          await fetch(
            "/api/payments/methods",
          );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load payment methods.",
          );
        }

        const methodList: PaymentMethodOption[] =
          Array.isArray(data.methods)
            ? data.methods
            : [];

        setMethods(methodList);
        const firstMethod = methodList[0];
        if (firstMethod) {
          setSelectedMethodId(firstMethod.id);
          setWalletId(firstMethod.wallets[0]?.id ?? "");
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load payment methods.",
        );
      } finally {
        setLoadingMethods(false);
      }
    }

    void loadMethods();
  }, []);

  function updateField(
    field: keyof CustomerForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectMethod(method: PaymentMethodOption) {
    setSelectedMethodId(method.id);
    setPaymentDetails({});
    setWalletId(method.wallets[0]?.id ?? "");
    setProofUrl("");
    setProofError("");
  }

  async function uploadProof(file: File) {
    setProofUrl("");
    setProofError("");
    if (!selectedMethod?.requireProof) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProofError("Choose a JPEG, PNG, or WebP screenshot.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProofError("Screenshots must be 5 MB or smaller.");
      return;
    }

    setProofUploading(true);
    const formData = new FormData();
    formData.set("methodId", selectedMethod.id);
    formData.set("file", file);

    try {
      const response = await fetch("/api/payments/proof-upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to upload screenshot.");
      setProofUrl(data.url);
    } catch (uploadError) {
      setProofError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload screenshot.",
      );
    } finally {
      setProofUploading(false);
    }
  }

  async function submitCheckout(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!items.length) {
      setError(
        "Your bag is empty.",
      );
      return;
    }

    if (!selectedMethod) {
      setError(
        "Choose an available payment method.",
      );
      return;
    }

    if (selectedMethod.isCrypto && !selectedWallet?.asset?.trim()) {
      setError("This crypto wallet's accepted token has not been configured yet.");
      return;
    }

    if (selectedMethod.requireProof && !proofUrl) {
      setError("Upload your payment screenshot before placing the order.");
      return;
    }

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/checkout",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              customer: form,
              paymentMethodId: selectedMethod.id,
              paymentDetails,
              walletId: selectedMethod.isCrypto ? walletId : undefined,
              paymentProofUrl: proofUrl || undefined,
              items,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to place your order.",
        );
      }

      setReceipt({
        orderNumber: data.orderNumber,
        phone: form.phone,
        total: Number(data.total),
        currency: data.currency,
        notificationSent: data.notificationSent === true,
      });
      window.localStorage.removeItem("pluggeo-cart");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to start checkout.",
      );

      setLoading(false);
    }
  }

  async function copyWalletAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedWallet(true);
      window.setTimeout(() => setCopiedWallet(false), 1800);
    } catch {
      setError("Copy was unavailable. Select and copy the wallet address instead.");
    }
  }

  if (receipt) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="text-body-sm text-text-secondary">ORDER #{receipt.orderNumber}</p>
        <h1 className="mt-3 text-h2 font-heading">Order received.</h1>
        <p className="mt-6 max-w-2xl text-body-md">
          {receipt.notificationSent
            ? "We&apos;ll contact you on WhatsApp shortly to confirm your order and provide payment instructions."
            : "Your order is saved. We could not send the owner notification, so please contact the store to confirm your order."}
        </p>
        <p className="mt-8 border-t border-border py-5 text-body-sm">
          We&apos;ll contact: <strong>{receipt.phone}</strong>
        </p>
        <p className="text-body-sm text-text-secondary">
          Order total: {currency.format(receipt.total)}
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-sm bg-primary px-5 py-3 text-body-sm text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Continue shopping
        </Link>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-24">
        <h1 className="text-3xl font-medium">
          Your bag is empty
        </h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-12">
        <h1 className="text-4xl">
          Checkout
        </h1>

        <p className="mt-3 text-sm opacity-60">
          Enter your details and choose how you would like to pay.
        </p>
      </div>

      <form
        onSubmit={submitCheckout}
        className="grid gap-10 lg:grid-cols-2"
      >
        <section className="space-y-6">
          <h2 className="text-xl">
            Contact information
          </h2>

          <input
            required
            aria-label="Full name"
            placeholder="Full name"
            value={form.name}
            onChange={(e) =>
              updateField(
                "name",
                e.target.value,
              )
            }
            className="w-full border p-4"
          />

          <input
            required
            type="email"
            aria-label="Email address"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              updateField(
                "email",
                e.target.value,
              )
            }
            className="w-full border p-4"
          />

          <input
            required
            aria-label="Phone or WhatsApp number"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              updateField(
                "phone",
                e.target.value,
              )
            }
            className="w-full border p-4"
          />

          <h2 className="pt-6 text-xl">
            Shipping address
          </h2>

          <input
            required
            aria-label="Street address"
            placeholder="Address"
            value={
              form.shippingLine1
            }
            onChange={(e) =>
              updateField(
                "shippingLine1",
                e.target.value,
              )
            }
            className="w-full border p-4"
          />

          <input
            aria-label="Apartment, suite, or unit"
            placeholder="Apartment, suite, etc. (optional)"
            value={
              form.shippingLine2
            }
            onChange={(e) =>
              updateField(
                "shippingLine2",
                e.target.value,
              )
            }
            className="w-full border p-4"
          />

          <input
            required
            aria-label="City"
            placeholder="City"
            value={form.city}
            onChange={(e) =>
              updateField(
                "city",
                e.target.value,
              )
            }
            className="w-full border p-4"
          />

          <input
            aria-label="State or province"
            placeholder="State / Province"
            value={form.state}
            onChange={(e) =>
              updateField(
                "state",
                e.target.value,
              )
            }
            className="w-full border p-4"
          />

          <input
            required
            aria-label="Postal code"
            placeholder="Postal code"
            value={
              form.postalCode
            }
            onChange={(e) =>
              updateField(
                "postalCode",
                e.target.value,
              )
            }
            className="w-full border p-4"
          />

          <input
            required
            aria-label="Country"
            placeholder="Country"
            value={form.country}
            onChange={(e) =>
              updateField(
                "country",
                e.target.value,
              )
            }
            className="w-full border p-4"
          />
        </section>

        <section>
          <div className="border border-border p-6">
            <h2 className="text-h5 font-medium">
              Order summary
            </h2>

            <div className="mt-6 space-y-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-black/10 pb-4 last:border-b-0 last:pb-0"
                >
                  {item.image?.src && (
                    <Image
                      src={item.image.src}
                      alt={item.image.alt || item.title}
                      className="h-14 w-14 shrink-0 rounded-sm object-cover"
                      width={56}
                      height={56}
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <p className="mt-1 text-xs opacity-70">
                        {item.selectedOptions.join(" • ")}
                      </p>
                    )}
                    <p className="mt-1 text-xs opacity-70">
                      Qty {item.quantity}
                    </p>
                  </div>

                  <div className="text-right text-sm font-medium">
                    <p>{currency.format((item.price ?? 0) * item.quantity)}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {currency.format(item.price ?? 0)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <fieldset className="mt-7 space-y-4 border-t border-border pt-5">
              <legend className="text-h6 font-medium">How would you like to pay?</legend>

              {loadingMethods && <p className="text-body-sm text-text-secondary">Loading payment methods...</p>}
              {!loadingMethods && methods.length === 0 && (
                <p className="text-body-sm text-destructive">No payment methods are available right now.</p>
              )}

              <div className="space-y-2">
                {methods.map((method) => (
                  <label
                    key={method.id}
                    className="flex cursor-pointer items-start gap-3 border border-border p-3 focus-within:ring-2 focus-within:ring-ring"
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      className="mt-1 size-4 accent-primary"
                      checked={selectedMethodId === method.id}
                      disabled={proofUploading}
                      onChange={() => selectMethod(method)}
                    />
                    <span className="min-w-0">
                      <span className="block text-body-sm font-medium">
                        {method.name}{method.isCrypto && Number(method.discountPercent) > 0 ? ` (${method.discountPercent}% off)` : ""}
                      </span>
                      <span className="mt-1 block text-body-sm text-text-secondary">{method.description}</span>
                    </span>
                  </label>
                ))}
              </div>

              {selectedMethod && (
                <div className="space-y-4 border-l-2 border-border pl-4">
                  {selectedMethod.instructions && (
                    <p className="text-body-sm text-text-secondary">{selectedMethod.instructions}</p>
                  )}

                  {selectedMethod.customerFields.map((field) => (
                    <label key={field.key} htmlFor={`payment-${field.key}`} className="grid gap-1.5 text-body-sm">
                      <span>{field.label}{field.required ? " *" : ""}</span>
                      <input
                        id={`payment-${field.key}`}
                        className="w-full border border-border bg-background px-3 py-3 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={paymentDetails[field.key] ?? ""}
                        placeholder={field.placeholder}
                        required={field.required}
                        maxLength={500}
                        onChange={(event) => setPaymentDetails((current) => ({ ...current, [field.key]: event.target.value }))}
                      />
                    </label>
                  ))}

                  {selectedMethod.isCrypto && (
                    <fieldset className="space-y-3">
                      <legend className="text-body-sm font-medium">Choose a wallet</legend>
                      {selectedMethod.wallets.map((wallet) => (
                        <div key={wallet.id} className="border border-border p-3">
                          <label className="flex items-center gap-2 text-body-sm font-medium">
                            <input
                              type="radio"
                              name="crypto-wallet"
                              className="size-4 accent-primary"
                              checked={walletId === wallet.id}
                              onChange={() => {
                                setWalletId(wallet.id);
                                setCopiedWallet(false);
                              }}
                            />
                            {wallet.name} · {wallet.network}{wallet.asset ? ` · ${wallet.asset}` : ""}
                          </label>
                          <span className="mt-2 block break-all font-mono text-body-sm">{wallet.address}</span>
                          <button
                            type="button"
                            className="mt-3 rounded-sm border border-border px-3 py-1.5 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => void copyWalletAddress(wallet.address)}
                          >
                            {copiedWallet && walletId === wallet.id ? "Copied" : "Copy wallet address"}
                          </button>
                        </div>
                      ))}
                      {selectedWallet && !selectedWallet.asset?.trim() && (
                        <p className="text-body-sm text-destructive">The accepted token for this wallet is not set yet. Do not send crypto until the owner configures it.</p>
                      )}
                    </fieldset>
                  )}

                  {selectedMethod.requireProof && (
                    <div className="space-y-2">
                      <label htmlFor="payment-proof" className="block text-body-sm font-medium">Payment screenshot *</label>
                      <input
                        id="payment-proof"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        required
                        disabled={proofUploading}
                        className="block w-full text-body-sm file:mr-3 file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadProof(file);
                        }}
                      />
                      <p role="status" aria-live="polite" className={proofError ? "text-body-sm text-destructive" : "text-body-sm text-text-secondary"}>
                        {proofUploading ? "Uploading screenshot..." : proofError || (proofUrl ? "Screenshot attached." : "JPEG, PNG, or WebP up to 5 MB.")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </fieldset>

            <div className="mt-6 space-y-3 border-t border-border pt-4 text-body-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span>{currency.format(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Crypto discount</span>
                  <span>-{currency.format(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span>{currency.format(Math.max(0, subtotal - discount))}</span>
              </div>
            </div>

            <p className="mt-6 text-body-sm text-text-secondary">
              No payment is processed on this website. We&apos;ll contact you on WhatsApp to confirm your order and payment instructions.
            </p>

            {error && (
              <div role="alert" className="mt-6 border border-destructive p-4 text-body-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                loadingMethods ||
                !selectedMethodId ||
                proofUploading ||
                (!!selectedMethod?.requireProof && !proofUrl) ||
                (!!selectedMethod?.isCrypto && !selectedWallet?.asset?.trim())
              }
              className="mt-8 w-full bg-primary px-6 py-4 text-body-sm text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {loading
                ? "Placing order..."
                : "Place order"}
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}