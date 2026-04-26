// Vitest global setup — point Prisma at a separate test DB so tests don't
// clobber dev data. The first test that uses prisma will create the schema.
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const TEST_DB = path.join(process.cwd(), "prisma", "test.db");
process.env.DATABASE_URL = `file:./test.db`;

if (!fs.existsSync(TEST_DB)) {
  // Push the schema to test.db once.
  execSync("npx prisma db push --skip-generate", {
    stdio: "ignore",
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
}
