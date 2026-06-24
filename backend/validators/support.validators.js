import { z } from "zod";

export const createSupportRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is too short")
    .max(80, "Name is too long"),

  email: z
    .string()
    .trim()
    .email("Invalid email format")
    .max(120, "Email is too long"),

  support_type: z
    .string()
    .trim()
    .min(2, "Support type is required")
    .max(50, "Support type is too long"),

  message: z
    .string()
    .trim()
    .min(5, "Message is too short")
    .max(2000, "Message is too long")
});