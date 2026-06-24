import { z } from "zod";

export const createPaymentRecordSchema = z.object({
  uid: z.string().trim().min(1, "uid is required"),
  username: z.string().trim().min(1, "username is required"),
  amount: z.number({
    required_error: "amount is required",
    invalid_type_error: "amount must be a number"
  }).positive("amount must be greater than 0"),
  memo: z.string().trim().optional(),
  metadata: z.record(z.any()).optional()
}).strict();

export const approvePaymentSchema = z.object({
  localPaymentId: z.string().trim().min(1, "localPaymentId is required"),
  paymentId: z.string().trim().min(1, "paymentId is required")
}).strict();

export const completePaymentSchema = z.object({
  localPaymentId: z.string().trim().min(1, "localPaymentId is required"),
  paymentId: z.string().trim().min(1, "paymentId is required"),
  txid: z.string().trim().min(1, "txid is required"),

  // Optionnels : utilisés pour activer le VIP si fournis
  uid: z.string().trim().min(1, "uid cannot be empty").optional(),
  username: z.string().trim().min(1, "username cannot be empty").optional()
}).strict();

export const userStatusQuerySchema = z.object({
  uid: z.string().trim().min(1, "uid is required")
}).strict();
