// Guard rail for seed scripts. Refuses to run when the connection target
// looks like a production database, so a stray `npm run db:seed` against
// a deployed env can't wipe real data. Override with `ALLOW_PROD_SEED=1`.

const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
const looksProd =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL === "1" ||
  /supabase\.co|pooler\.supabase\.com|amazonaws\.com|render\.com|neon\.tech/.test(url);

if (looksProd && process.env.ALLOW_PROD_SEED !== "1") {
  console.error("\n[seed] Refusing to run against what looks like a production database.");
  console.error("[seed] DATABASE_URL host pattern matched a managed-DB provider.");
  console.error("[seed] If you really mean to seed this DB, re-run with ALLOW_PROD_SEED=1.");
  console.error("[seed] Aborting.\n");
  process.exit(1);
}
