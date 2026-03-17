import { z } from "zod";
import { AppError } from "@/utils/AppError";

// Coerce null/undefined from form to empty string so we get clear validation messages
const requiredString = (schema) => z.preprocess((val) => (val == null ? "" : val), schema);
const optionalStringToNull = () =>
  z.preprocess((val) => {
    if (val == null) return null;
    if (typeof val !== "string") return val;
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  }, z.string().nullable());

export const registerSchema = z.object({
  email: requiredString(z.email()),
  password: requiredString(z.string().min(6)),
  firstName: requiredString(z.string().min(1)),
  lastName: requiredString(z.string().min(1)),
  username: requiredString(z.string().min(3)),
  phoneNumber: z.string().nullish(),
  dateOfBirth: optionalStringToNull(),
  country: optionalStringToNull(),
  profilePictureUrl: z.string().nullish(),
}).strict();

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
}).strict();


export function validateRegister(data) {
  const result = registerSchema.safeParse(data);

  if (!result.success) {
    const formattedErrors = {};

    result.error.issues.forEach((issue) => {
      const field = issue.path[0];
      formattedErrors[field] = issue.message;
    });

    throw new AppError(
      "Validation failed",
      400,
      formattedErrors
    );
  }

  // Return parsed data so preprocess/normalization takes effect (e.g. "" -> null)
  return result.data;
}

export function validateLogin(data) {
  const result = loginSchema.safeParse(data);

  if (!result.success) {
  
    throw new AppError("Email and password are invalid",400);
  }
  

  return data;
}
