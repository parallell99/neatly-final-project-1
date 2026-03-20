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

function parseDateOfBirth(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Prefer YYYY-MM-DD (from <input type="date">) to avoid timezone shifts.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const birth = new Date(y, mo - 1, d);
    if (Number.isNaN(birth.getTime())) return null;
    return birth;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function isAtLeastAge(birthDate, ageYears) {
  const now = new Date();
  const cutoff = new Date(now.getFullYear() - ageYears, now.getMonth(), now.getDate());
  return birthDate <= cutoff;
}

export const registerSchema = z.object({
  email: requiredString(z.email()),
  password: requiredString(z.string().min(6)),
  firstName: requiredString(z.string().min(1)),
  lastName: requiredString(z.string().min(1)),
  username: requiredString(z.string().min(3)),
  phoneNumber: z.string().nullish(),
  dateOfBirth: requiredString(z.string().min(1, "Date of birth is required.")).refine(
    (val) => {
      const birth = parseDateOfBirth(val);
      if (!birth) return false;
      return isAtLeastAge(birth, 12);
    },
    "You must be at least 12 years old."
  ),
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
