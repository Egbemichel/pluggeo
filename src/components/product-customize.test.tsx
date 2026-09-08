import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductCustomize } from "./product-customize";

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
});
