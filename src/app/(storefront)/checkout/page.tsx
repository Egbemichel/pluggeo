"use client";

import { FormEvent, useEffect, useState } from "react";
import { currency } from "@/components/product-card";

type PaymentProviderOption = {
  id: string;
  providerName: string;
  status: string;
  minimumCurrency: string;
  minimumAmount: number;
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

  const [providers, setProviders] =
    useState<PaymentProviderOption[]>([]);

  const [selectedProviderId, setSelectedProviderId] =
    useState("");

  const [loadingProviders, setLoadingProviders] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadProviders() {
      try {
        const response =
          await fetch(
            "/api/payments/card2crypto/providers",
          );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to load payment providers.",
          );
        }

        const providerList =
          Array.isArray(data.providers)
            ? data.providers
            : [];

        setProviders(providerList);

        if (providerList[0]) {
          setSelectedProviderId(
            providerList[0].id,
          );
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load payment providers.",
        );
      } finally {
        setLoadingProviders(false);
      }
    }

    void loadProviders();
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

    if (!selectedProviderId) {
      setError(
        "Please select a payment provider before continuing.",
      );
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
              paymentProvider: selectedProviderId,
              items,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to start checkout.",
        );
      }

      window.location.href =
        data.paymentUrl;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to start checkout.",
      );

      setLoading(false);
    }
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
          Enter your information to
          continue to secure payment.
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
          <div className="border p-6">
            <h2 className="text-xl">
              Order summary
            </h2>

            <div className="mt-6 space-y-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-black/10 pb-4 last:border-b-0 last:pb-0"
                >
                  {item.image?.src && (
                    <img
                      src={item.image.src}
                      alt={item.image.alt || item.title}
                      className="h-14 w-14 shrink-0 rounded-sm object-cover"
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

            <div className="mt-6 space-y-3 border-t border-black/10 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="opacity-70">Subtotal</span>
                <span>{currency.format(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span>{currency.format(subtotal)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="block text-sm font-medium">
                Payment provider
              </label>

              {loadingProviders ? (
                <div className="rounded border border-black/10 bg-black/5 px-4 py-3 text-sm opacity-70">
                  Loading providers...
                </div>
              ) : providers.length === 0 ? (
                <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  No active payment providers are available right now.
                </div>
              ) : (
                <div className="space-y-2">
                  {providers.map((provider) => (
                    <label
                      key={provider.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded border border-black/10 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment-provider"
                          checked={
                            selectedProviderId ===
                            provider.id
                          }
                          onChange={() =>
                            setSelectedProviderId(
                              provider.id,
                            )
                          }
                          className="h-4 w-4"
                        />
                        <span>{provider.providerName}</span>
                      </div>

                      <span className="text-xs opacity-70">
                        Min {provider.minimumAmount} {provider.minimumCurrency}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <p className="mt-6 text-sm opacity-60">
              You will be redirected to
              our secure card payment
              provider to complete
              your payment.
            </p>

            {error && (
              <div className="mt-6 border border-red-500 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                loadingProviders ||
                !selectedProviderId ||
                providers.length === 0
              }
              className="mt-8 w-full bg-black px-6 py-4 text-white disabled:opacity-50"
            >
              {loading
                ? "Preparing payment..."
                : "Continue to payment"}
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}