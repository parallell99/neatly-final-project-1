"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/layout/navbar";
import Input from "@/components/ui/Input/Input";
import DatePicker from "@/components/ui/DatePicker/DatePicker";
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { useImageUpload } from "@/hooks/useImageUpload";
import Button from "@/components/ui/buttons/buttons";
import { thaiProvinces } from "@/data/thaiProvinces";
import ExclamationCircle from "@/assets/icons/exclamation-circle.svg?url";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Register() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useRegisterForm();
  
  const { uploadImage, uploading } = useImageUpload();

  const profilePicture = watch("profilePicture");

  // Handle image preview
  React.useEffect(() => {
    if (profilePicture && profilePicture.length > 0) {
      const file = profilePicture[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  }, [profilePicture]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let profilePictureUrl = null;
      if (data.profilePicture && data.profilePicture.length > 0) {
        profilePictureUrl = await uploadImage(data.profilePicture[0]);
      }

      const { status } = await axios.post("/api/auth/register", {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        province: data.province,
        profilePictureUrl,
      });

      if (status === 201) {
        alert("Register Successfully");
        router.push("/login");
      }
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
    const file = e.target.files;
    if (file && file.length > 0) {
      setValue("profilePicture", file, { shouldValidate: true });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="flex flex-col w-full px-[16px] py-[40px] gap-[40px] bg-bg">
        <h3 className="headline-3 text-green-800">Register</h3>

        <form className="flex flex-col gap-[40px]" onSubmit={handleSubmit(onSubmit)}>
          {/* Basic Information Section */}
          <section className="flex flex-col w-full gap-[24px]">
            <h5 className="headline-5 text-gray-600 ">Basic Information</h5>

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

            <Input
              label="Phone number"
              name="phoneNumber"
              type="tel"
              placeholder="Enter your phone number"
              register={register}
              error={errors.phoneNumber}
              required
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
            <div className="flex flex-col w-full gap-[4px]">
              <label htmlFor="province" className="font-normal text-[16px]">
                Country
              </label>
              <div className="relative w-full">
                <Select
                  value={watch("province") || undefined}
                  onValueChange={(value) => setValue("province", value, { shouldValidate: true })}
                >
                  <SelectTrigger
                    id="province"
                    className={`w-full px-[12px] py-[12px] h-auto min-h-[48px] border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-base
                      ${errors.province
                        ? "border-red"
                        : "border-gray-300 bg-white hover:border-gray-400"
                      }
                      text-black data-[placeholder]:text-gray-600 [&>span]:text-left
                    `}
                  >
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {thaiProvinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.province && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                    <img src={ExclamationCircle} className="w-5 h-5" alt="" aria-hidden />
                  </span>
                )}
              </div>
              {errors.province && (
                <p className="text-[14px] text-red">{errors.province.message}</p>
              )}
            </div>
          </section>
          {/* Profile Picture Section */}
          <section>
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
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  {...register("profilePicture")}
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
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button buttonStyle="primary" buttonText={isSubmitting || uploading ? "Register..." : "Register"} type="submit" disabled={isSubmitting || uploading} />
        </form>
      </main>
    </div>
  );
}
