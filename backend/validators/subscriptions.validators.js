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

export const createSubscriptionSchema = z.object({
  owner_user_id: safeText("owner_user_id", 120),

  merchant_listing_id: z
    .union([
      z.coerce.number().int().positive(),
      z.string().trim().min(1).max(120)
    ])
    .optional(),

  plan_code: safeText("plan_code", 80),

  plan_name: safeText("plan_name", 120),

  billing_cycle: z
    .enum(["monthly", "quarterly", "yearly", "weekly"])
    .optional(),

  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .max(100000, "Amount is too high"),

  currency: z
    .string()
    .trim()
    .min(1, "Currency cannot be empty")
    .max(10, "Currency is too long")
    .optional()
});

export const listSubscriptionsQuerySchema = z
  .object({
    owner_user_id: z
      .string()
      .trim()
      .min(1, "owner_user_id cannot be empty")
      .max(120, "owner_user_id is too long")
      .optional(),

    page: z.coerce
      .number()
      .int("page must be an integer")
      .min(1, "page must be greater than or equal to 1")
      .optional(),

    limit: z.coerce
      .number()
      .int("limit must be an integer")
      .min(1, "limit must be greater than or equal to 1")
      .max(100, "limit must be less than or equal to 100")
      .optional()
  })
  .strict();

export const subscriptionIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("Subscription ID must be an integer")
    .positive("Subscription ID must be positive")
});

export const updateSubscriptionSchema = z
  .object({
    status: z
      .enum(["pending", "active", "expired", "cancelled", "paused"])
      .optional(),

    end_date: optionalSafeText("end_date", 80),

    payment_reference: optionalSafeText("payment_reference", 200)
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.end_date !== undefined ||
      data.payment_reference !== undefined,
    {
      message: "At least one field is required for update",
      path: ["body"]
    }
  );
