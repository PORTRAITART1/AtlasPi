import crypto from "crypto";

const DEFAULT_TTL_HOURS = 168; // 7 days

function resolveTtlMs() {
  const hours = Number(process.env.AUTH_TOKEN_TTL_HOURS);
  const effective = Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_TTL_HOURS;
  return effective * 60 * 60 * 1000;
}

// Access tokens are stored hashed so a database leak does not expose usable
// bearer credentials. Lookups must hash the incoming token the same way.
export function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

export function isTokenExpired(createdAt) {
  if (!createdAt) {
    return true;
  }

  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) {
    return true;
  }

  return Date.now() - created > resolveTtlMs();
}
