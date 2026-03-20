"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { subYears, startOfDay } from "date-fns";

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    username: z.string().trim().min(3, "Username must be at least 3 characters.").max(30, "Username too long.").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscore allowed.").transform((val) => val.toLowerCase()),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().trim().min(6, "Password must be at least 6 characters long."),/*.regex(/[A-Z]/, "Must include uppercase").regex(/[0-9]/, "Must include number")*/
    confirmPassword: z.string().trim(),
    dateOfBirth: z
      .string()
      .trim()
      .min(1, "Date of birth is required.")
      .refine(
        (val) => {
          const [y, m, d] = val.split("-").map(Number);
          const birth = new Date(y, m - 1, d);
          if (isNaN(birth.getTime())) return false;
          const maxBirth = subYears(startOfDay(new Date()), 12);
          return birth <= maxBirth;
        },
        "You must be at least 12 years old."
      ),
    country: z.string().trim().optional(),
    profilePicture: z
      .any()
      .optional()
      .refine((file) => {
        if (!file) return true;

        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        return allowedTypes.includes(file.type);
      }, "Only JPEG, PNG, GIF or WebP allowed.")
      .refine((file) => {
        if (!file) return true;

        const maxSize = 5 * 1024 * 1024;
        return file.size <= maxSize;
      }, "File must be less than 5MB."),

    phoneNumber: z
      .string()
      .min(1, "Phone number is required.")
      .refine((value) => {
        const phone = parsePhoneNumberFromString(value);
        return phone?.isValid() ?? false;
      }, "Invalid phone number.")
      .transform((value) => {
        const phone = parsePhoneNumberFromString(value);
        return phone ? phone.number : value;
      }),

  })


  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function useRegisterForm() {
  const form = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onBlur", // 👈 เปลี่ยนจาก onChange เพื่อ UX ที่ดีกว่า,
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      dateOfBirth: "",
      country: "",
      profilePicture: undefined,
    },
  });

  return form;
}
