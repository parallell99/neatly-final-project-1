"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import axios from "axios";
import { CalendarIcon, Upload, X } from "lucide-react";
import Button from "@/components/ui/buttons/buttons";
import Input from "@/components/ui/AuthInput/AuthInput";
import { useAuth } from "@/contexts/authentication";
import { format, subYears, startOfDay } from "date-fns";
import { supabase } from "@/lib/supabase";
import CountrySelector from "@/components/ui/CountrySelector/CountrySelector";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/booking/popover";
import { ButtonCalendar } from "@/components/ui/booking/calendar-button";
import { Calendar as CalendarComponent } from "@/components/ui/booking/calendar";
import { cn } from "@/lib/utils";
import PhoneInput from "@/components/ui/PhoneInput/PhoneInput";

const MINIMUM_AGE = 12;
const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const getParsedPhone = (value) => parsePhoneNumberFromString(value);
const isPhoneValid = (value) => getParsedPhone(value)?.isValid() ?? false;
const toE164Phone = (value) => getParsedPhone(value)?.number ?? value;

const isAtLeastMinimumAge = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const birthDate = new Date(year, month - 1, day);
  if (isNaN(birthDate.getTime())) return false;

  const maxBirthDate = subYears(startOfDay(new Date()), MINIMUM_AGE);
  return birthDate <= maxBirthDate;
};

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .min(1, "Phone number is required.")
    .refine((value) => isPhoneValid(value), "Invalid phone number.")
    .transform((value) => toE164Phone(value)),
  dateOfBirth: z
    .string()
    .trim()
    .min(1, "Date of birth is required.")
    .refine((value) => isAtLeastMinimumAge(value), `You must be at least ${MINIMUM_AGE} years old.`),
  profilePicture: z
    .any()
    .optional()
    .refine((file) => {
      if (!file) return true;
      return ALLOWED_PROFILE_IMAGE_TYPES.includes(file.type);
    }, "Only JPEG, PNG, GIF or WebP allowed.")
    .refine((file) => {
      if (!file) return true;
      return file.size <= MAX_PROFILE_IMAGE_SIZE;
    }, "File must be less than 5MB."),
  country: z.string().trim().optional(),
});

export default function UserProfile() {
  const { user, getUserLoading, fetchUser } = useAuth();
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(/** @type {File | null} */(null));
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */(null));
  const today = startOfDay(new Date());
  const maxBirth = subYears(today, MINIMUM_AGE);
  const maxBirthYear = maxBirth.getFullYear();

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      profilePicture: undefined,
      country: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    setValue("firstName", user.first_name ?? "");
    setValue("lastName", user.last_name ?? "");
    setValue("email", user.email ?? "");
    setValue("phone", user.phone ?? "");
    setValue("country", user.country ?? "");
    setProfileImageUrl(user.profile_image_url ?? "");
    if (user.date_of_birth) {
      const d = new Date(user.date_of_birth);
      if (!isNaN(d.getTime())) {
        setDateOfBirth(d);
        setValue("dateOfBirth", format(d, "yyyy-MM-dd"), { shouldValidate: true });
      }
    }
  }, [user, setValue]);

  const country = watch("country");

  const onUpdateProfile = async (data) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUpdateError("Please log in to update profile.");
      return;
    }
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      await axios.patch(
        "/api/users/profile",
        {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          country: data.country,
          dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (selectedFile) {
        const userId = user?.id;
        if (!userId) throw new Error("User id not found");
        const fileExt = selectedFile.name.split(".").pop();
        const filePath = `users/${userId}/avatar.${fileExt}?v=${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from("nealty-profile-image")
          .upload(filePath, selectedFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage
          .from("nealty-profile-image")
          .getPublicUrl(filePath);
        await axios.patch(
          "/api/users/avatar",
          { avatarUrl: publicData.publicUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (profileImageUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(profileImageUrl);
        }
        setProfileImageUrl(publicData.publicUrl);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else if (profileImageUrl === "" && user?.profile_image_url) {
        await axios.patch(
          "/api/users/avatar",
          { avatarUrl: "" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await fetchUser();
    } catch (err) {
      const message = err.response?.data?.error ?? err.message ?? "Update failed";
      setUpdateError(message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const onRemoveProfilePicture = (e) => {
    e?.stopPropagation?.();
    if (profileImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(profileImageUrl);
    }
    setProfileImageUrl("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // TODO: call PATCH /api/users/avatar with null or empty to clear
    setValue("profilePicture", undefined, { shouldValidate: true });
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setValue("profilePicture", undefined, { shouldValidate: true });
      return;
    }
    if (profileImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(profileImageUrl);
    }
    const url = URL.createObjectURL(file);
    setProfileImageUrl(url);
    setSelectedFile(file);
    setValue("profilePicture", file, { shouldValidate: true });
  };

  const onBoxClick = () => {
    fileInputRef.current?.click();
  };

  const onBoxDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (profileImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(profileImageUrl);
    }
    const url = URL.createObjectURL(file);
    setProfileImageUrl(url);
    setSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onBoxDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const blobUrlRef = useRef(/** @type {string | null} */(null));
  useEffect(() => {
    blobUrlRef.current = profileImageUrl?.startsWith("blob:") ? profileImageUrl : null;
  }, [profileImageUrl]);
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  if (getUserLoading) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-4 py-12 text-center text-gray-600">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-[800px] mx-auto px-4 py-12 text-center text-gray-600">
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-8 lg:py-12">
      {/* Header: Title + Update Profile button (desktop: same row, button right) */}
      <div className="flex sm:items-center mb-10 w-full">
        <h1 className="font-serif headline-3 text-center text-gray-800">
          Profile
        </h1>

      </div>

      <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-10">
        {updateError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {updateError}
          </div>
        )}
        {/* Basic Information */}
        <section>
          <h2 className="text-base font-medium text-gray-600 mb-6">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="First name"
              name="firstName"
              type="text"
              placeholder="First name"
              register={register}
              error={errors.firstName}
            />
            <Input
              label="Last name"
              name="lastName"
              type="text"
              placeholder="Last name"
              register={register}
              error={errors.lastName}
            />
            <Input
              label="Email"
              name="email"
              type="text"
              placeholder="Email"
              register={register}
              error={errors.email}
              disabled
            />
            <PhoneInput
              label="Phone number"
              name="phone"
              control={control}
              placeholder="Enter your phone number"
              error={errors.phone}
              disableSearchIcon={true}
              searchStyle={{ width: "100%", boxSizing: "border-box" }}
            />
            <div className="flex flex-col gap-1">
              <label className="font-normal text-[16px] text-gray-900" htmlFor="dateOfBirth">
                Date of Birth
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <ButtonCalendar
                    id="dateOfBirth"
                    variant="outline"
                    className={cn(
                      "w-full h-[50px] justify-between text-left text-[16px] font-normal shadow-none text-gray-900 rounded-[4px] hover:bg-white hover:cursor-pointer focus:ring-1 focus:ring-orange-500",
                      "data-[state=open]:ring-1 data-[state=open]:ring-orange-500 data-[state=open]:ring-offset-0",
                      !dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    {dateOfBirth ? (
                      format(dateOfBirth, "PPP")
                    ) : (
                      <span className="text-gray-600">Select your date of birth</span>
                    )}
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                  </ButtonCalendar>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white shadow-md border">
                  <CalendarComponent
                    mode="single"
                    defaultMonth={dateOfBirth ?? subYears(today, MINIMUM_AGE)}
                    selected={dateOfBirth ?? undefined}
                    toYear={maxBirthYear}
                    onSelect={(d) => {
                      setDateOfBirth(d ?? null);
                      setValue("dateOfBirth", d ? format(d, "yyyy-MM-dd") : "", {
                        shouldValidate: true,
                      });
                    }}
                    disabled={(day) => {
                      return day > today || day > maxBirth;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red">{errors.dateOfBirth.message}</p>
              )}
            </div>
            <CountrySelector
              label="Country"
              name="country"
              placeholder="Select country"
              value={country || ""}
              onChange={(v) => setValue("country", v)}
              error={errors.country}
            />
          </div>
        </section>

        {/* Profile Picture */}
        <section className="flex flex-col items-center lg:items-start gap-4">
          <h2 className="text-base font-medium text-gray-600 text-center lg:text-left">
            Profile Picture
          </h2>
          <div className="flex flex-col items-start w-[167px] h-[167px]">
            <label
              htmlFor="userProfilePicture"
              onDrop={onBoxDrop}
              onDragOver={onBoxDragOver}
              className={`
                relative w-full max-w-xs aspect-square rounded-[4px]
                flex flex-col items-center justify-center cursor-pointer
                transition-all duration-200 overflow-hidden border
                bg-gray-200 border-gray-300 hover:border-gray-400
              `}
            >
              <input
                ref={fileInputRef}
                id="userProfilePicture"
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
                aria-label="Upload profile picture"
              />
              {profileImageUrl ? (
                <>
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover object-center pointer-events-none"
                  />
                  <button
                    type="button"
                    onClick={onRemoveProfilePicture}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white shadow-lg hover:bg-red-500 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 z-10"
                    aria-label="Remove profile picture"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="relative z-10 text-[30px] text-orange-500 flex flex-col items-center">
                  +
                  <span className="text-orange-500 font-medium text-base">Upload photo</span>
                </div>
              )}
            </label>
            {errors.profilePicture && (
              <p className="mt-2 text-sm text-red">{errors.profilePicture.message}</p>
            )}
          </div>
          <Button
            type="submit"
            buttonStyle="primary"
            buttonText={updateLoading ? "Updating..." : "Update Profile"}
            className="rounded-lg px-6 py-2.5 font-medium shrink-0 w-fit sm:hidden "
            onClick={handleSubmit(onUpdateProfile)}
            disabled={updateLoading}
          />
        </section>
      </form>
    </div>
  );
}
