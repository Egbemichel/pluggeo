import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { useFormDraft, clearFormDraft } from "./use-form-draft";

function TestForm({ draftKey }: { draftKey: string }) {
  const [text, setText] = useState("");
  const [restoredCount, setRestoredCount] = useState(0);
  useFormDraft(draftKey, { text }, (draft) => {
    setText(draft.text);
    setRestoredCount((c) => c + 1);
  });

  return (
    <div>
      <input aria-label="text" value={text} onChange={(e) => setText(e.target.value)} />
      <span data-testid="restored-count">{restoredCount}</span>
    </div>
  );
}

describe("useFormDraft", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("saves the current value to sessionStorage as it changes", () => {
    render(<TestForm draftKey="k1" />);
    fireEvent.change(screen.getByLabelText("text"), { target: { value: "hello" } });
    expect(JSON.parse(sessionStorage.getItem("k1")!)).toEqual({ text: "hello" });
  });

  it("restores a previously saved draft on mount, without clobbering it first", () => {
    sessionStorage.setItem("k2", JSON.stringify({ text: "draft from before a refresh" }));
    render(<TestForm draftKey="k2" />);

    expect((screen.getByLabelText("text") as HTMLInputElement).value).toBe(
      "draft from before a refresh"
    );
    expect(screen.getByTestId("restored-count").textContent).toBe("1");
    // The restored value must still be what's in storage afterwards -- a
    // same-commit "pristine value" save racing ahead of the restore would
    // have overwritten it with "" before the restore's re-render landed.
    expect(JSON.parse(sessionStorage.getItem("k2")!)).toEqual({
      text: "draft from before a refresh",
    });
  });

  it("does not restore when no draft exists", () => {
    render(<TestForm draftKey="k3" />);
    expect((screen.getByLabelText("text") as HTMLInputElement).value).toBe("");
    expect(screen.getByTestId("restored-count").textContent).toBe("0");
  });

  it("clearFormDraft removes the stored draft", () => {
    sessionStorage.setItem("k4", JSON.stringify({ text: "x" }));
    clearFormDraft("k4");
    expect(sessionStorage.getItem("k4")).toBeNull();
  });
});
