// Vitest global setup.
//
//  • Forces deterministic-stub mode for AI calls (zero OpenAI billing in tests)
//  • Points Prisma at the *direct* Postgres URL (port 5432) so tests can
//    use prepared statements / transactions the pooler restricts.
//  • All test data is scoped to a synthetic schoolId starting with __TEST__,
//    cleaned up centrally by factories.cleanupAllTestData().

import * as fs from "fs";
import * as path from "path";

process.env.OPENAI_API_KEY = "";
process.env.ANTHROPIC_API_KEY = "";
process.env.AI_MODEL = "stub-test";

// Use the direct URL when available locally. CI injects DATABASE_URL through
// env secrets and we trust whatever's been set there.
if (!process.env.CI) {
  try {
    const env = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
    const direct = env.match(/^DIRECT_URL="([^"]+)"/m)?.[1];
    if (direct) process.env.DATABASE_URL = direct;
  } catch { /* ok if .env is missing */ }
}

export const TEST_SCHOOL_PREFIX = "__TEST__";
