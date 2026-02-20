"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Input from "@/components/ui/Input/Input";
import Button from "@/components/ui/buttons/buttons";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useAuth } from "@/contexts/authentication";

export default function Login() {
    const [submitError, setSubmitError] = useState(null);
    const { login, loading } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useLoginForm();

    const onSubmit = async (data) => {
        setSubmitError(null);
        const result = await login(data.email, data.password);
        if (result?.error) {
            setSubmitError(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <header className="w-full max-w-[1440px] mx-auto">
                <img
                    src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1440&q=80"
                    alt="Outdoor lounge area with pool"
                    className="w-full h-[269px] object-cover"
                />
            </header>

            <main className="w-full mx-auto px-[16px] py-[40px]  bg-white">
                <div className="max-w-[400px] mx-auto flex flex-col gap-8">
                    <h1 className="headline-3 text-green-800">Log In</h1>

                    <form
                        className="flex flex-col gap-[40px]"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <Input
                            label="Username or Email"
                            name="email"
                            type="text"
                            placeholder="Enter your username or email"
                            register={register}
                            error={errors.email}
                            required
                        />

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            register={register}
                            error={errors.password}
                            required
                        />

                        {submitError && (
                            <div className="bg-status-red-bg border border-status-red-text/20 rounded-lg px-4 py-3">
                                <p className="text-sm text-status-red-text">{submitError}</p>
                            </div>
                        )}
                        <div className="flex flex-col w-full gap-[16px]">
                            <Button
                                buttonStyle="primary"
                                buttonText={loading ? "Logging in..." : "Log In"}
                                type="submit"
                                disabled={loading}
                            />

                            <p className="body-1 text-gray-700">
                                Don't have an account yet?{" "}
                                <Link
                                    href="/register"
                                    className="font-medium text-orange-500 hover:text-orange-600 transition-colors"
                                >
                                    Register
                                </Link>
                            </p></div>
                    </form>
                </div>
            </main>
        </div>
    );
}
