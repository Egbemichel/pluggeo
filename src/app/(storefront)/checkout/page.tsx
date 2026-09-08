"use client";

import { FormEvent, useState } from "react";

type CartItem = {
  id: string;
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
        quantity?: unknown;
      };

      if (typeof item.id !== "string" && typeof item.id !== "number") {
        return [];
      }

      const quantity = Number(item.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return [];
      }

      return [{ id: String(item.id), quantity }];
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

  const [form, setForm] =
    useState<CustomerForm>(
      emptyForm,
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

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
              Payment
            </h2>

            <p className="mt-4 text-sm opacity-60">
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
              disabled={loading}
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