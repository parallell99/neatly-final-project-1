"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().trim().min(6, "Password must be at least 6 characters long.")//.regex(/[A-Z]/, "Must include uppercase").regex(/[0-9]/, "Must include number"),
});

export function useLoginForm() {
  const form = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return form;
}
