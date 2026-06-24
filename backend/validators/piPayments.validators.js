import { z } from "zod";

const safeId = z
  .string()
  .trim()
  .min(3, "ID is too short")
  .max(200, "ID is too long");

const piUid = z
  .string()
  .trim()
  .min(3, "UID is too short")
  .max(120, "UID is too long");

const username = z
  .string()
  .trim()
  .min(1, "Username is required")
  .max(80, "Username is too long");

const optionalSignature = z
  .string()
  .trim()
  .min(10, "Signature is too short")
  .max(10000, "Signature is too long")
  .optional();

const optionalPayload = z
  .union([
    z.string().trim().min(2).max(20000),
    z.record(z.string(), z.any())
  ])
  .optional();

export const createPiPaymentRecordSchema = z.object({
  uid: piUid,

  username,

  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .max(100000, "Amount is too high"),

  memo: z
    .string()
    .trim()
    .max(250, "Memo is too long")
    .optional(),

  metadata: z
    .record(z.string(), z.any())
    .optional()
});

export const approvePiPaymentSchema = z.object({
  paymentId: safeId,
  signature: optionalSignature,
  payload: optionalPayload
});

export const completePiPaymentSchema = z.object({
  paymentId: safeId,
  txid: safeId,
  signature: optionalSignature,
  payload: optionalPayload
});

export const verifyPiPaymentParamsSchema = z.object({
  paymentId: safeId
});