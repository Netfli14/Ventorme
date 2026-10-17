import { randomBytes, scryptSync } from "node:crypto";
import { writeFile } from "node:fs/promises";
// Run locally in your own terminal. This writes an ignored file and never
// transmits secrets, changes Vercel settings or prints credentials into CI logs.
const password = randomBytes(21).toString("base64url"),
  salt = randomBytes(16).toString("hex");
const result = {
  password,
  VENTORME_ADMIN_PASSWORD_HASH: `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
  VENTORME_SESSION_SECRET: randomBytes(48).toString("hex"),
};
await writeFile(
  ".env.admin-setup.json",
  JSON.stringify(result, null, 2) + "\n",
  { mode: 0o600, flag: "wx" },
);
console.log(
  "Created .env.admin-setup.json. Add the two VENTORME_* values to your Vercel project environment, redeploy, then use password at /stats/. Keep this file private.",
);
