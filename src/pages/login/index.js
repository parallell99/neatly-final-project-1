"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Input from "@/components/ui/AuthInput/AuthInput";
import Button from "@/components/ui/buttons/buttons";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useAuth } from "@/contexts/authentication";
import loginImage from "@/assets/images/8.jpg"
import { useRouter } from "next/router";

export default function Login() {
    const [submitError, setSubmitError] = useState(null);
    const { login, loading, user } = useAuth();
    const router = useRouter();

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

    useEffect(() => {
        if (user) {
            router.replace("/"); // หรือ "/dashboard"
        }
    }, [user]);

    return (
        <div className="max-h-screen max-w-screen overflow-hidden bg-white">
            <Navbar />
            <div className="flex flex-col lg:flex-row lg:h-full ">
                <header className="lg:flex-1 w-full max-w-[1440px] mx-auto relative">
                    <img
                        src={loginImage?.src || loginImage || ''}
                        alt="Outdoor lounge area with pool"
                        className="w-full h-[269px] lg:h-full object-cover object-center "
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_47.43%,rgba(0,0,0,0.4)_105.14%)]"></div>
                </header>

                <main className="lg:flex-1 w-full mx-auto px-[16px] lg:pt-[150px] py-[40px]  bg-white">
                    <div className="max-w-[400px] mx-auto flex flex-col gap-8">
                        <h1 className="headline-3 text-green-800">Log In</h1>

                        <form
                            className="flex flex-col gap-[40px]"
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <Input
                                label="Email"
                                name="email"
                                type="text"
                                placeholder="Enter your email"
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
        </div>
    );
}
