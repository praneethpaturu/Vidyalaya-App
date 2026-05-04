// Tests for the unified grading engine (BRD §4.3).
import { describe, it, expect } from "vitest";
import { gradeAnswer, gradeNumeric } from "@/lib/exam-grading";

describe("MCQ grading", () => {
  const q = { id: "q", type: "MCQ", correct: JSON.stringify([2]), marks: 4 };
  it("correct answer awards full marks", async () => {
    const r = await gradeAnswer(q, 2, 1);
    expect(r.marksAwarded).toBe(4);
    expect(r.isCorrect).toBe(true);
  });
  it("wrong answer applies negative penalty", async () => {
    const r = await gradeAnswer(q, 1, 1);
    expect(r.marksAwarded).toBe(-1);
    expect(r.isCorrect).toBe(false);
  });
  it("not attempted → 0 (no negative)", async () => {
    const r = await gradeAnswer(q, null, 1);
    expect(r.marksAwarded).toBe(0);
    expect(r.isCorrect).toBe(null);
  });
});

describe("MULTI grading", () => {
  const q = { id: "q", type: "MULTI", correct: JSON.stringify([0, 2]), marks: 4 };
  it("exact match awards full marks", async () => {
    const r = await gradeAnswer(q, [0, 2], 1);
    expect(r.marksAwarded).toBe(4);
  });
  it("partial match → negative", async () => {
    const r = await gradeAnswer(q, [0], 1);
    expect(r.marksAwarded).toBe(-1);
  });
  it("extra wrong selection → negative", async () => {
    const r = await gradeAnswer(q, [0, 2, 3], 1);
    expect(r.marksAwarded).toBe(-1);
  });
});

describe("Numeric tolerance grading", () => {
  it("within tolerance accepts", () => {
    const q = { correct: "9.81", marks: 4, numericTolerance: 0.01 };
    expect(gradeNumeric(q, 9.812, 1).marksAwarded).toBe(4);
    expect(gradeNumeric(q, 9.808, 1).marksAwarded).toBe(4);
  });
  it("outside tolerance rejects", () => {
    const q = { correct: "9.81", marks: 4, numericTolerance: 0.01 };
    expect(gradeNumeric(q, 9.85, 1).marksAwarded).toBe(-1);
  });
  it("range mode accepts any value in [min, max]", () => {
    const q = { correct: "0", marks: 4, numericRangeMin: 5, numericRangeMax: 10 };
    expect(gradeNumeric(q, 7, 1).marksAwarded).toBe(4);
    expect(gradeNumeric(q, 5, 1).marksAwarded).toBe(4);
    expect(gradeNumeric(q, 11, 1).marksAwarded).toBe(-1);
  });
});

describe("Fill — accepts variants", () => {
  const q = { id: "q", type: "FILL", correct: JSON.stringify(["Mahatma Gandhi", "M K Gandhi"]), marks: 2 };
  it("accepts case + whitespace variation", async () => {
    expect((await gradeAnswer(q, "  mahatma gandhi  ", 0)).marksAwarded).toBe(2);
  });
  it("accepts alternative form", async () => {
    expect((await gradeAnswer(q, "M K Gandhi", 0)).marksAwarded).toBe(2);
  });
  it("rejects unrelated answer", async () => {
    expect(Math.abs((await gradeAnswer(q, "Subhas Bose", 0)).marksAwarded)).toBe(0);
  });
});

describe("True/False grading", () => {
  const q = { id: "q", type: "TRUE_FALSE", correct: '"true"', marks: 1 };
  it("matches case-insensitively", async () => {
    expect((await gradeAnswer(q, "True", 0)).marksAwarded).toBe(1);
  });
});

describe("Descriptive without rubric", () => {
  it("returns 0 with manual-pending feedback", async () => {
    const q = { id: "q", type: "DESCRIPTIVE", correct: "model", marks: 5 };
    const r = await gradeAnswer(q, "long answer", 0);
    expect(r.marksAwarded).toBe(0);
    expect(r.feedback).toContain("Pending");
  });
});

describe("Type-coercion guard — teacher flips question type mid-attempt", () => {
  it("MCQ receiving a DESCRIPTIVE-shaped object unwraps to text without crashing", async () => {
    // student answered when the Q was DESCRIPTIVE → response = { text, attachments }
    // teacher flipped to MCQ → grader receives the object on submit
    const q = { id: "q", type: "MCQ", correct: JSON.stringify([0]), marks: 4 };
    const r = await gradeAnswer(q, { text: "Paris", attachments: [] }, 1);
    // The object is unwrapped to "Paris" then parsed as an MCQ index — fails
    // to parse, so grading returns 0 marks rather than throwing.
    expect(r.marksAwarded).toBe(0);
    expect(r.source).toBe("AUTO");
  });
  it("FILL receiving an object unwraps to its text and matches", async () => {
    const q = { id: "q", type: "FILL", correct: JSON.stringify(["paris"]), marks: 2 };
    const r = await gradeAnswer(q, { text: "Paris", attachments: [] }, 0);
    expect(r.marksAwarded).toBe(2);
  });
  it("DESCRIPTIVE receiving an object continues to the rubric branch", async () => {
    const q = { id: "q", type: "DESCRIPTIVE", correct: "model", marks: 5, rubric: null };
    const r = await gradeAnswer(q, { text: "long", attachments: [] }, 0);
    // No rubric → manual-pending
    expect(r.feedback).toContain("Pending");
  });
});
