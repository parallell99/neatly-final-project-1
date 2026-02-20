import { z } from "zod";

// Coerce null/undefined from form to empty string so we get clear validation messages
const requiredString = (schema) => z.preprocess((val) => (val == null ? "" : val), schema);

export const registerSchema = z.object({
  email: requiredString(z.string().email()),
  password: requiredString(z.string().min(6)),
  firstName: requiredString(z.string().min(1)),
  lastName: requiredString(z.string().min(1)),
  username: requiredString(z.string().min(3)),
  phoneNumber: z.string().nullish(),
  dateOfBirth: requiredString(z.string().min(1)),
  province: requiredString(z.string().min(1)),
  profilePictureUrl: z.string().nullish(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function getValidationMessage(error) {
  const issues = error.issues ?? error.errors;
  const first = Array.isArray(issues) ? issues[0] : null;
  return first?.message ?? error.message ?? "Validation failed";
}

export function validateRegister(data) {
  const result = registerSchema.safeParse(data);

  if (!result.success) {
    return {
      status: 400,
      message: getValidationMessage(result.error),
    };
  }

  return null;
}

export function validateLogin(data) {
  const result = loginSchema.safeParse(data);

  if (!result.success) {
    return {
      status: 400,
      message: getValidationMessage(result.error),
    };
  }

  return null;
}
