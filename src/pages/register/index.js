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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/booking/popover";
import { CalendarIcon } from "lucide-react";
import { ButtonCalendar } from "@/components/ui/booking/calendar-button";
import { Calendar } from "@/components/ui/booking/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Register() {
  const { fetchUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [date, setDate] = useState(undefined);
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

  // เพิ่ม useEffect เพื่อ sync date state จาก watch
  React.useEffect(() => {
    const dob = watch("dateOfBirth");
    if (dob) {
      setDate(new Date(dob));
    } else {
      setDate(undefined);
    }
  }, [watch("dateOfBirth")]);

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
          avatarUrl: publicUrl,
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
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
                  disableSearchIcon={true}
                  required
                  country="th"
                />


                {/* Date of Birth - Popover + Calendar */}
                <div className="w-full">
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-[16px] font-normal text-gray-900 mb-2"
                  >
                    Date of Birth
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <ButtonCalendar
                      id="dateOfBirth"
                        variant="outline"
                        className={cn(
                          "w-full h-[50px] justify-between text-left text-[16px] font-normal text-gray-900 hover:bg-white hover:cursor-pointer focus:ring-1 focus:ring-orange-500",
                          "data-[state=open]:ring-1 data-[state=open]:ring-orange-500 data-[state=open]:ring-offset-0 ",
                          !date && "text-muted-foreground",
                          errors.dateOfBirth && "border-red"
                        )}
                      >

                        {date ? format(date, "PPP") : <span className="text-gray-600">Select your date of birth</span>}<CalendarIcon className="h-4 w-4 text-gray-500" />
                      </ButtonCalendar>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white shadow-md border ">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => {
                          setDate(selectedDate);
                          setValue(
                            "dateOfBirth",
                            selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
                            { shouldValidate: true }
                          );
                        }}
                        disabled={(day) => day > new Date()}
                        initialFocus
                        classNames={{ day: "focus:outline-none focus:ring-0" }}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red">{errors.dateOfBirth.message}</p>
                  )}
                </div>



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
            <section className=" lg:gap-[40px] ">
              <h5 className="headline-5 text-gray-600 pb-[24px]">Profile Picture</h5>
              <div className="flex flex-col items-start w-[167px] h-[167px] ">
                <label
                  htmlFor="profilePicture"
                  className={`
                  relative w-full max-w-xs aspect-square 
                   rounded-[4px] 
                  flex flex-col items-center justify-center cursor-pointer
                  transition-all duration-200 overflow-hidden 
                  ${errors.profilePicture
                      ? 'border-red-500 bg-red-50'
                      : 'bg-gray-200 hover:border-gray-400'
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
                      <div className="relative z-10 text-[30px] text-orange-500 flex flex-col items-center ">
                        +
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
              <Button buttonStyle="primary" buttonText={isSubmitting ? "Register..." : "Register"} type="submit" disabled={isSubmitting}  className=""/>
            </div>
          </form>
        </main>
      </div>
    </div >
  );
}
