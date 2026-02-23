"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  username: z.string().min(3, "Username must be at least 3 characters long."),
  email: z.email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  confirmPassword: z.string(),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits."),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  country: z.string().min(1, "Please select your country."),
  profilePicture: z.any().optional(),

}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export function useRegisterForm() {
  const form = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
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
