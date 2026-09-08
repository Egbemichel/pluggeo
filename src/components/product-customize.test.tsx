import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductCustomize } from "./product-customize";
import { variantMatchesSelectedOptions } from "@/lib/checkout";

describe("ProductCustomize", () => {
  it("preselects the first option in each group so the product is ready to add to bag", () => {
    const onSelectionChange = vi.fn();

    render(
      <ProductCustomize
        options={[
          { key: "Size", values: ["7 inches", "8 inches"], valuePriceDeltas: {} },
          { key: "Metal", values: ["Gold", "Silver"], valuePriceDeltas: {} },
        ]}
        variants={[]}
        price={200}
        onSelectionChange={onSelectionChange}
      />,
    );

    expect(onSelectionChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        values: ["7 inches", "Gold"],
      }),
    );
  });

  it("matches a valid cart selection against the real variant attributes even when keys differ only by casing or ordering", () => {
    const variantAttributes = {
      Size: "7 inches",
      "Gold Color": "Rose Gold",
    };

    const optionGroups = [
      { key: "Gold Color", values: ["Rose Gold", "Silver 925"] },
      { key: "Size", values: ["7 inches", "8 inches"] },
    ];

    expect(
      variantMatchesSelectedOptions(
        variantAttributes,
        ["Rose Gold", "7 inches"],
        optionGroups,
      ),
    ).toBe(true);
  });
});
