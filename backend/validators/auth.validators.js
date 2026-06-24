import { z } from "zod";

const safeText = (fieldName, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(max, `${fieldName} is too long`);

const optionalSafeText = (fieldName, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} cannot be empty`)
    .max(max, `${fieldName} is too long`)
    .optional();

export const piAuthBodySchema = z
  .object({
    uid: safeText("uid", 120),

    username: safeText("username", 120),

    accessToken: safeText("accessToken", 5000),

    wallet_address: optionalSafeText("wallet_address", 200)
  })
  .strict();

export const authProfileParamsSchema = z
  .object({
    uid: safeText("uid", 120)
  })
  .strict();
