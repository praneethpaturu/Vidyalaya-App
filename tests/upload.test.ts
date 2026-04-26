import { describe, it, expect } from "vitest";
import { sanitiseName } from "@/lib/upload";

describe("upload helpers", () => {
  it("sanitises file names — strips slashes and odd chars (dots stay for extension)", () => {
    // Path-traversal protection happens at the storage-path level; sanitise just
    // collapses unsafe characters in the *display* name. Slashes must be gone.
    expect(sanitiseName("../../etc/passwd")).not.toContain("/");
    expect(sanitiseName("My Homework #1.pdf")).toBe("My_Homework_1.pdf");
    expect(sanitiseName("scary;rm -rf /.txt")).not.toContain(";");
    expect(sanitiseName("scary;rm -rf /.txt")).not.toContain(" ");
  });

  it("trims very long names", () => {
    const long = "a".repeat(500) + ".pdf";
    const out = sanitiseName(long);
    expect(out.length).toBeLessThanOrEqual(120);
  });
});
