import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  products,
  productOptions,
  productVariants,
} from "@/db/schema";

export type CheckoutItemInput = {
  id: string;
  quantity: number;
  selectedOptions?: string[];
};

export type ResolvedCheckoutItem = {
  productId: string;
  productSlug: string;
  productName: string;
  quantity: number;
  selectedOptions: string[];
  unitPrice: number;
  lineTotal: number;
};

export type CheckoutQuote = {
  items: ResolvedCheckoutItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: "USD";
};

function extractProductSlug(cartId: string): string {
  // Cart IDs are:
  // /product/product-slug
  // or:
  // /product/product-slug::option1|option2

  const href = cartId.split("::")[0];

  const match = href.match(/^\/product\/([^/?#]+)$/);

  if (!match) {
    throw new Error(`Invalid cart item: ${cartId}`);
  }

  return decodeURIComponent(match[1]);
}

function normalizeOptionValue(value: string): string {
  const trimmed = value.trim();

  // Supports either:
  // "Gold"
  // or "Metal: Gold"
  //
  // Your existing cart may store either representation.
  const separatorIndex = trimmed.lastIndexOf(":");

  if (separatorIndex === -1) {
    return trimmed;
  }

  return trimmed.slice(separatorIndex + 1).trim();
}

function getPriceDelta(
  valuePriceDeltas: Record<string, number>,
  value: string,
): number {
  const delta = valuePriceDeltas[value];

  if (delta === undefined || delta === null) {
    return 0;
  }

  const numericDelta = Number(delta);

  if (!Number.isFinite(numericDelta)) {
    throw new Error(`Invalid price delta for option value: ${value}`);
  }

  return numericDelta;
}

function getVariantValues(
  attributes: Record<string, string>,
): string[] {
  return Object.values(attributes)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function variantMatchesSelectedOptions(
  variantAttributes: Record<string, string>,
  selectedValues: string[],
  optionGroups: Array<{ key: string; values: string[] }> = [],
): boolean {
  if (optionGroups.length > 0) {
    const remainingNotMatched = [...selectedValues.map(normalizeOptionValue)];
    const expectedAttributes: Record<string, string> = {};

    for (const optionGroup of optionGroups) {
      const allowedValues = optionGroup.values.map(normalizeOptionValue);
      const matchedValue = allowedValues.find((allowedValue) => {
        const index = remainingNotMatched.findIndex(
          (remainingValue) =>
            remainingValue.toLowerCase() === allowedValue.toLowerCase(),
        );

        if (index === -1) {
          return false;
        }

        remainingNotMatched.splice(index, 1);
        return true;
      });

      if (!matchedValue) {
        return false;
      }

      expectedAttributes[optionGroup.key] = matchedValue;
    }

    if (remainingNotMatched.length > 0) {
      return false;
    }

    if (
      Object.keys(expectedAttributes).length !==
      Object.keys(variantAttributes).length
    ) {
      return false;
    }

    return Object.entries(expectedAttributes).every(([key, value]) => {
      const variantValue = variantAttributes[key];

      return (
        variantValue !== undefined &&
        normalizeOptionValue(variantValue).toLowerCase() ===
          value.trim().toLowerCase()
      );
    });
  }

  const variantValues = getVariantValues(variantAttributes);

  if (variantValues.length !== selectedValues.length) {
    return false;
  }

  const variantSet = new Set(
    variantValues.map((value) => value.toLowerCase()),
  );

  return selectedValues.every((value) =>
    variantSet.has(value.toLowerCase()),
  );
}

async function resolveProductPrice(
  product: typeof products.$inferSelect,
  selectedOptions: string[],
): Promise<number> {
  const [options, variants] = await Promise.all([
    db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, product.id)),

    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id)),
  ]);

  const normalizedSelectedOptions = selectedOptions
    .map(normalizeOptionValue)
    .filter(Boolean);

  /*
   * Validate every selected option against the product's actual
   * product_options.values.
   */
  let optionPriceDelta = 0;

  for (const selectedValue of normalizedSelectedOptions) {
    let matchingOptionFound = false;

    for (const option of options) {
      const values = option.values ?? [];

      const matchingValue = values.find(
        (value) =>
          value.trim().toLowerCase() ===
          selectedValue.toLowerCase(),
      );

      if (!matchingValue) {
        continue;
      }

      matchingOptionFound = true;

      optionPriceDelta += getPriceDelta(
        option.valuePriceDeltas ?? {},
        matchingValue,
      );

      break;
    }

    if (!matchingOptionFound) {
      throw new Error(
        `Invalid option "${selectedValue}" for product "${product.name}".`,
      );
    }
  }

  /*
   * If the product has variants, the selected combination MUST
   * correspond to an actual variant.
   *
   * This prevents a malicious client from inventing combinations
   * that don't exist in the database.
   */
  if (variants.length > 0) {
    const matchingVariant = variants.find((variant) =>
      variantMatchesSelectedOptions(
        variant.attributes ?? {},
        normalizedSelectedOptions,
        options.map((option) => ({
          key: option.key,
          values: option.values ?? [],
        })),
      ),
    );

    if (!matchingVariant) {
      throw new Error(
        `The selected configuration for "${product.name}" is not available.`,
      );
    }

    if (!matchingVariant.available) {
      throw new Error(
        `The selected configuration for "${product.name}" is currently unavailable.`,
      );
    }

    /*
     * A variant priceOverride takes precedence over the normal
     * product price + option deltas.
     */
    if (matchingVariant.priceOverride !== null) {
      const overriddenPrice = Number(
        matchingVariant.priceOverride,
      );

      if (!Number.isFinite(overriddenPrice) || overriddenPrice < 0) {
        throw new Error(
          `Invalid variant price for "${product.name}".`,
        );
      }

      return overriddenPrice;
    }
  }

  /*
   * No variant override:
   *
   * base product price
   * +
   * per-option price additions
   */
  const basePrice = Number(product.price);

  if (!Number.isFinite(basePrice) || basePrice < 0) {
    throw new Error(`Invalid product price for "${product.name}".`);
  }

  return basePrice + optionPriceDelta;
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

function fromCents(value: number): number {
  return value / 100;
}

export async function resolveCheckoutItems(
  inputItems: CheckoutItemInput[],
): Promise<ResolvedCheckoutItem[]> {
  if (inputItems.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const resolvedItems: ResolvedCheckoutItem[] = [];

  for (const inputItem of inputItems) {
    if (!Number.isInteger(inputItem.quantity)) {
      throw new Error("Invalid item quantity.");
    }

    if (inputItem.quantity < 1 || inputItem.quantity > 100) {
      throw new Error("Item quantity must be between 1 and 100.");
    }

    const productSlug = extractProductSlug(inputItem.id);

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, productSlug))
      .limit(1);

    if (!product) {
      throw new Error(
        `The product "${productSlug}" no longer exists.`,
      );
    }

    if (product.status !== "published") {
     throw new Error(
       `"${product.name}" is no longer available for purchase.`,
     );
}

    const selectedOptions = inputItem.selectedOptions ?? [];

    const unitPrice = await resolveProductPrice(
      product,
      selectedOptions,
    );

    const unitPriceCents = toCents(unitPrice);

    const lineTotalCents =
      unitPriceCents * inputItem.quantity;

    resolvedItems.push({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      quantity: inputItem.quantity,
      selectedOptions,
      unitPrice: fromCents(unitPriceCents),
      lineTotal: fromCents(lineTotalCents),
    });
  }

  return resolvedItems;
}

export async function createCheckoutQuote(
  inputItems: CheckoutItemInput[],
): Promise<CheckoutQuote> {
  const items = await resolveCheckoutItems(inputItems);

  const subtotalCents = items.reduce(
    (total, item) =>
      total + toCents(item.lineTotal),
    0,
  );

  /*
   * Plug Geo currently has no shipping-rate or tax-rate engine
   * in the existing application.
   *
   * Therefore these are explicitly zero rather than pretending
   * that a tax/shipping calculation exists.
   */
  const shippingCents = 0;
  const taxCents = 0;

  const totalCents =
    subtotalCents +
    shippingCents +
    taxCents;

  return {
    items,
    subtotal: fromCents(subtotalCents),
    shipping: fromCents(shippingCents),
    tax: fromCents(taxCents),
    total: fromCents(totalCents),
    currency: "USD",
  };
}