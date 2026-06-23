import { z } from "zod";

const LISTING_STATUSES = ["pending_review", "approved", "rejected", "suspended"];

function emptyStringToUndefined(value) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

function toBooleanLike(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return value;
}

const optionalBoolean = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    return toBooleanLike(value);
  },
  z.boolean().optional()
);

const requiredText = (label, max = 160) =>
  z
    .string({
      required_error: `${label} is required`,
      invalid_type_error: `${label} must be a string`
    })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long`);

const optionalText = (label, max = 500) =>
  z.preprocess(
    emptyStringToUndefined,
    z
      .string({
        invalid_type_error: `${label} must be a string`
      })
      .trim()
      .max(max, `${label} is too long`)
      .optional()
  );

const optionalEmail = z.preprocess(
  emptyStringToUndefined,
  z
    .string({
      invalid_type_error: "Email must be a string"
    })
    .trim()
    .email("Invalid email format")
    .max(254, "Email is too long")
    .optional()
);

const optionalUrl = (label) =>
  z.preprocess(
    emptyStringToUndefined,
    z
      .string({
        invalid_type_error: `${label} must be a string`
      })
      .trim()
      .url(`${label} must be a valid URL`)
      .max(500, `${label} is too long`)
      .optional()
  );

const optionalPhone = (label) =>
  z.preprocess(
    emptyStringToUndefined,
    z
      .string({
        invalid_type_error: `${label} must be a string`
      })
      .trim()
      .regex(/^[+0-9().\-\s]{4,40}$/, `${label} has an invalid format`)
      .max(40, `${label} is too long`)
      .optional()
  );

export const merchantListingIdParamsSchema = z
  .object({
    id: z
      .string({
        required_error: "Merchant listing ID is required"
      })
      .regex(/^[1-9][0-9]*$/, "Merchant listing ID must be a positive integer")
  })
  .strict();

export const merchantListingSearchQuerySchema = z
  .object({
    q: optionalText("Search query", 120),
    search: optionalText("Search query", 120),
    domain: optionalText("Domain", 80),
    category: optionalText("Category", 80),
    country: optionalText("Country", 80),
    city: optionalText("City", 80),
    accepts_pi: optionalBoolean
  })
  .strict();

export const merchantListingCreateSchema = z
  .object({
    owner_user_id: requiredText("Owner user ID", 128),

    listing_public_name: requiredText("Listing public name", 120),
    business_name: optionalText("Business name", 160),
    public_description_short: requiredText("Short public description", 300),

    profile_type: requiredText("Profile type", 50),
    domain: requiredText("Domain", 80),
    category: requiredText("Category", 80),
    products_services_summary: optionalText("Products/services summary", 1200),

    country: requiredText("Country", 80),
    city: requiredText("City", 80),
    district: optionalText("District", 120),
    address_line_1: optionalText("Address line 1", 250),
    location_link: optionalUrl("Location link"),

    owner_display_name: requiredText("Owner display name", 120),

    phone_business: optionalPhone("Business phone"),
    whatsapp_business: optionalPhone("Business WhatsApp"),
    email_business: optionalEmail,
    website_url: optionalUrl("Website URL"),

    merchant_pi_wallet: optionalText("Merchant Pi wallet", 128),
    merchant_pi_payments_enabled: optionalBoolean.default(false),
    accepts_pi: optionalBoolean.default(false),

    visibility_phone: optionalText("Phone visibility", 30),
    visibility_whatsapp: optionalText("WhatsApp visibility", 30),
    visibility_email: optionalText("Email visibility", 30),
    visibility_website: optionalText("Website visibility", 30),
    visibility_wallet: optionalText("Wallet visibility", 30)
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.merchant_pi_payments_enabled === true &&
      (!data.merchant_pi_wallet || !data.merchant_pi_wallet.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["merchant_pi_wallet"],
        message: "Merchant Pi wallet is required when Pi payments are enabled"
      });
    }
  });

export const merchantListingUpdateSchema = z
  .object({
    listing_public_name: optionalText("Listing public name", 120),
    business_name: optionalText("Business name", 160),
    public_description_short: optionalText("Short public description", 300),

    domain: optionalText("Domain", 80),
    category: optionalText("Category", 80),
    products_services_summary: optionalText("Products/services summary", 1200),

    country: optionalText("Country", 80),
    city: optionalText("City", 80),
    district: optionalText("District", 120),
    address_line_1: optionalText("Address line 1", 250),
    location_link: optionalUrl("Location link"),

    owner_display_name: optionalText("Owner display name", 120),

    phone_business: optionalPhone("Business phone"),
    whatsapp_business: optionalPhone("Business WhatsApp"),
    email_business: optionalEmail,
    website_url: optionalUrl("Website URL"),

    merchant_pi_wallet: optionalText("Merchant Pi wallet", 128),
    merchant_pi_payments_enabled: optionalBoolean,
    accepts_pi: optionalBoolean,

    visibility_phone: optionalText("Phone visibility", 30),
    visibility_whatsapp: optionalText("WhatsApp visibility", 30),
    visibility_email: optionalText("Email visibility", 30),
    visibility_website: optionalText("Website visibility", 30),
    visibility_wallet: optionalText("Wallet visibility", 30),
    latitude: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z.number().min(-90).max(90).optional()
    ),
    longitude: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z.number().min(-180).max(180).optional()
    )
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
  })
  .superRefine((data, ctx) => {
    if (
      data.merchant_pi_payments_enabled === true &&
      data.merchant_pi_wallet !== undefined &&
      (!data.merchant_pi_wallet || !data.merchant_pi_wallet.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["merchant_pi_wallet"],
        message: "Merchant Pi wallet cannot be empty when Pi payments are enabled"
      });
    }
  });

export const merchantListingModerateSchema = z
  .object({
    listing_status: z.enum(LISTING_STATUSES, {
      required_error: "Listing status is required",
      invalid_type_error: "Listing status must be a string"
    }),
    moderation_reason: optionalText("Moderation reason", 1000)
  })
  .strict();

const positiveIntegerQueryParam = (label) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, `${label} must be a positive integer`)
    .transform(Number);

export const merchantListingListQuerySchema = z
  .object({
    page: positiveIntegerQueryParam("Page").optional(),
    limit: positiveIntegerQueryParam("Limit")
      .refine((value) => value <= 100, "Limit must be less than or equal to 100")
      .optional()
  })
  .strict();