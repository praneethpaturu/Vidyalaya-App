import { describe, it, expect } from "vitest";
import { llm, llmConfigured } from "@/lib/ai/provider";

// setup.ts has already wiped OPENAI_API_KEY + ANTHROPIC_API_KEY for tests,
// so every call should land on the deterministic stub.

describe("llm provider — stub mode", () => {
  it("reports llmConfigured() === false when no key is set", () => {
    expect(llmConfigured()).toBe(false);
  });

  it("returns a stub response (provider='stub')", async () => {
    const r = await llm([{ role: "user", content: "Hello" }], { task: "summary" });
    expect(r.provider).toBe("stub");
    expect(r.model).toBe("stub-v1");
    expect(typeof r.text).toBe("string");
    expect(r.text.length).toBeGreaterThan(0);
  });

  it("is deterministic for the same prompt + task", async () => {
    const a = await llm([{ role: "user", content: "Class went well" }], { task: "summary" });
    const b = await llm([{ role: "user", content: "Class went well" }], { task: "summary" });
    expect(a.text).toBe(b.text);
  });

  it("differs by task", async () => {
    const sum  = await llm([{ role: "user", content: "Subject material" }], { task: "summary" });
    const quiz = await llm([{ role: "user", content: "Subject material" }], { task: "quiz" });
    expect(sum.text).not.toBe(quiz.text);
  });

  it("counts approximate tokens for stub responses", async () => {
    const r = await llm([{ role: "user", content: "x".repeat(100) }], { task: "summary" });
    expect(r.tokensIn).toBeGreaterThan(0);
    expect(r.tokensOut).toBeGreaterThan(0);
  });
});
