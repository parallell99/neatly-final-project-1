"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/layout/navbar";
import Input from "@/components/ui/AuthInput/AuthInput";
import DatePicker from "@/components/ui/DatePicker/DatePicker";
import { useRegisterForm } from "@/hooks/useRegisterForm";
import Button from "@/components/ui/buttons/buttons";
import axios from "axios";
import CountrySelector from "@/components/ui/CountrySelector/CountrySelector";
import PhoneInput from "@/components/ui/PhoneInput/PhoneInput";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/authentication";
import RegisterImage from "@/assets/images/9.jpg"

export default function Register() {
  const { fetchUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control
  } = useRegisterForm();



  const profilePicture = watch("profilePicture");

  // Handle image preview
  React.useEffect(() => {
    if (profilePicture) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(profilePicture);
    } else {
      setPreviewImage(null);
    }
  }, [profilePicture]);

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setValue("profilePicture", null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1️.สมัครสมาชิกก่อน
      const response = await axios.post("/api/auth/register", {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        country: data.country,
      });

      const { userId, token } = response.data.data;

      if (token) {
        localStorage.setItem("token", token);
        await fetchUser();
      }

      let publicUrl = null;

      // 2️.ถ้ามีรูป → upload ไป Supabase Storage
      if (data.profilePicture) {
        const file = data.profilePicture;

        const fileExt = file.name.split(".").pop();
        const filePath = `users/${userId}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("nealty-profile-image")
          .upload(filePath, file, {
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // 3️. เอา public URL
        const { data: publicData } = supabase.storage
          .from("nealty-profile-image")
          .getPublicUrl(filePath);

        publicUrl = publicData.publicUrl;

        // 4️. ส่ง URL ไป backend เพื่อ update database
        await axios.patch("/api/users/avatar", {
          userId,
          avatarUrl: publicUrl,
        },
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {},
          }
        );
      }

      router.push("/");

    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        "Register failed";

      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, GIF, WebP).");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("The file is too large. Please upload an image smaller than 5MB.");
      return;
    }

    // ✅ เก็บเป็น file เดียว ไม่ใช่ FileList
    setValue("profilePicture", file, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />
      <div className="lg:relative lg:px-[174px] lg:pt-[60px] lg:pb-[100px] overflow-hidden">
        <img
          src={RegisterImage?.src || RegisterImage || ''}
          alt="Outdoor lounge area with pool"
          className="hidden lg:block w-full h-[269px] lg:h-full object-cover lg:scale-125 absolute  left-0 right-0 top-0"
        />
        <div className="hidden lg:block lg:absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.6)_19.66%,rgba(0,0,0,0)_100%)]"></div>

        <main className="flex flex-col lg:justify-center lg:items-center w-full px-[16px] py-[40px] gap-[40px] lg:gap-[60px] bg-bg lg:relative lg:px-[60px] lg:pt-[80px] lg:z-50">
          <h3 className="lg:hidden self-start headline-3 text-green-800  ">Register</h3>
          <h2 className="hidden lg:flex self-start headline-2 text-green-800  ">Register</h2>

          <form className="flex flex-col w-full lg:w-min-[1092px] gap-[40px]" onSubmit={handleSubmit(onSubmit)}>
            {/* Basic Information Section */}
            <section className="flex flex-col w-full gap-[24px] pb-[40px] border-b">
              <h5 className="headline-5 text-gray-600 pb-[16px] ">Basic Information</h5>
              <div className="contents lg:grid lg:grid-cols-2  lg:gap-[40px] lg:w-full">
                <Input
                  label="First name"
                  name="firstName"
                  placeholder="Enter your first name"
                  register={register}
                  error={errors.firstName}
                  required
                />

                <Input
                  label="Last name"
                  name="lastName"
                  placeholder="Enter your last name"
                  register={register}
                  error={errors.lastName}
                  required
                />

                <Input
                  label="Username"
                  name="username"
                  placeholder="Enter your username"
                  register={register}
                  error={errors.username}
                  required
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
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

                <Input
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  register={register}
                  error={errors.confirmPassword}
                  required
                />

                <PhoneInput
                  label="Phone number"
                  name="phoneNumber"
                  control={control}
                  placeholder="Enter your phone number"
                  error={errors.phoneNumber}
                  required
                  country="th"
                />


                {/* Date and Location Section */}

                <DatePicker
                  label="Date of Birth"
                  name="dateOfBirth"
                  placeholder="Select your date of birth"
                  register={register}
                  error={errors.dateOfBirth}
                  setValue={setValue}
                  watch={watch}
                  required
                />
                {/* Country selection */}
                <CountrySelector
                  label="Country"
                  placeholder="Select your country"
                  name="country"
                  value={watch("country")}
                  onChange={(value) => setValue("country", value, { shouldValidate: true })}
                  error={errors.country}
                  required
                />
              </div>
            </section>

            {/* Profile Picture Section */}
            <section className="lg:grid grid-cols-2 lg:gap-[40px]">
              <div className="flex flex-col items-center">
                <label
                  htmlFor="profilePicture"
                  className={`
                  relative w-full max-w-xs aspect-square 
                  border border-gray-300 rounded-lg
                  flex flex-col items-center justify-center cursor-pointer
                  transition-all duration-200 overflow-hidden
                  ${errors.profilePicture
                      ? 'border-red-500 bg-red-50'
                      : 'bg-white hover:border-gray-400'
                    }
                `}
                >
                  {previewImage ? (
                    <>
                      <img
                        src={previewImage}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                      {/* ปุ่มกากบาท */}
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white shadow-lg hover:bg-red hover:cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95
  "                 >
                        ✕
                      </button>
                      <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-lg pointer-events-none" />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-lg m-2" />
                      <div className="relative z-10 flex flex-col items-center">
                        <svg
                          className="w-16 h-16 text-orange-500 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <span className="text-orange-500 font-medium text-base">Upload photo</span>
                      </div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
                {errors.profilePicture && (
                  <p className="mt-2 text-sm text-red-500">{errors.profilePicture.message}</p>
                )}
              </div>
            </section>

            {/* Submit Error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red">{submitError}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="contents lg:grid grid-cols-2 lg:gap-[40px]">
            <Button buttonStyle="primary" buttonText={isSubmitting ? "Register..." : "Register"} type="submit" disabled={isSubmitting} />
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
