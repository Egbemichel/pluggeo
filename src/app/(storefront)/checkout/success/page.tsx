"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type OrderStatus = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
};

export default function CheckoutSuccessPage() {
  const params =
    useSearchParams();

  const orderNumber =
    params.get("order");

  const [order, setOrder] =
    useState<OrderStatus | null>(
      null,
    );

  useEffect(() => {
    if (!orderNumber) return;

    async function load() {
     if (!orderNumber) {
       return;
     }

      const response = await fetch(
        `/api/orders/${encodeURIComponent(
          orderNumber,
        )}/status`,
      );

      if (!response.ok) return;

      const data = await response.json();

      setOrder(data);
    }
    load();
  }, [orderNumber]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-sm uppercase tracking-widest opacity-60">
        Plug Geo
      </p>

      <h1 className="mt-4 text-4xl">
        Thank you for your order.
      </h1>

      <p className="mt-6 opacity-70">
        Your order has been received.
        Your payment is being
        confirmed.
      </p>

      {orderNumber && (
        <div className="mt-10 border p-6">
          <p className="text-sm opacity-60">
            Order number
          </p>

          <p className="mt-1 text-lg">
            {orderNumber}
          </p>

          {order && (
            <>
              <p className="mt-6 text-sm opacity-60">
                Payment
              </p>

              <p className="mt-1">
                {order.paymentStatus}
              </p>

              <p className="mt-6 text-sm opacity-60">
                Order status
              </p>

              <p className="mt-1">
                {order.status}
              </p>
            </>
          )}
        </div>
      )}
    </main>
  );
}