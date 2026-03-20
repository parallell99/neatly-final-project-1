"use client";

import { useState, useEffect } from "react";
import LogoFoot from "@/assets/logo/logo-foot.svg";
import PhoneIcon from "@/assets/icons/phone.svg";
import MailIcon from "@/assets/icons/mail.svg";
import LocationIcon from "@/assets/icons/location.svg";
import SocialIcon from "@/assets/icons/social.svg";

const DEFAULT_PHONE = "+66 99 999 9999";
const DEFAULT_EMAIL = "contact@neatlyhotel.com";
const DEFAULT_ADDRESS = "188 Phaya Thai Rd, Thung Phaya Thai, Ratchathewi, Bangkok 10400";

export default function Footer() {
  const [hotelName, setHotelName] = useState("Neatly Hotel");
  const [hotelLogoFooterUrl, setHotelLogoFooterUrl] = useState(null);
  const [hotelPhone, setHotelPhone] = useState(DEFAULT_PHONE);
  const [hotelEmail, setHotelEmail] = useState(DEFAULT_EMAIL);
  const [hotelLocation, setHotelLocation] = useState(DEFAULT_ADDRESS);
  const [hotelFooterDescription, setHotelFooterDescription] = useState("");

  // ข้อมูลจากตาราง hotel_information (API /api/hotel-information)
  useEffect(() => {
    fetch("/api/hotel-information")
      .then((res) => res.json())
      .then((json) => {
        const d = json?.data;
        if (d) {
          setHotelName(d.hotelName ?? "Neatly Hotel");
          setHotelLogoFooterUrl(d.hotelLogoFooterUrl ?? null);
          setHotelPhone(d.hotelPhone && String(d.hotelPhone).trim() ? d.hotelPhone.trim() : DEFAULT_PHONE);
          setHotelEmail(d.hotelEmail && String(d.hotelEmail).trim() ? d.hotelEmail.trim() : DEFAULT_EMAIL);
          setHotelLocation(d.hotelLocation && String(d.hotelLocation).trim() ? d.hotelLocation.trim() : DEFAULT_ADDRESS);
          setHotelFooterDescription(d.hotelFooterDescription && String(d.hotelFooterDescription).trim() ? d.hotelFooterDescription.trim() : "");
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="w-full bg-green-800 text-white py-12 px-4 ">
      <div className="max-w-[1440px] mx-auto lg:px-15">
        <div className="flex flex-col lg:flex-row lg:justify-between ">
        {/* Logo & Description Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
           {hotelLogoFooterUrl ? (
             <img src={hotelLogoFooterUrl} alt={hotelName} className="w-40 h-auto mb-5 object-contain" />
           ) : (
             <LogoFoot className="w-40 mb-5" />
           )}
          </div>
          <h2 className="headline-5 mb-2">{hotelName}</h2>
          <p className="body-2">
            {hotelFooterDescription || "The best hotel for rising your experience"}
          </p>
        </div>

        {/* Contact Section */}
        <div className="mb-8">
          <h3 className=" mb-6 headline-5">CONTACT</h3>
          <div className="flex flex-col gap-4">
            {/* Phone — จาก hotel_information.hotel_phone */}
            <div className="flex items-start gap-3">
              <PhoneIcon className="w-5 h-5 shrink-0 text-green-500" aria-hidden />
              <span className="text-base font-normal text-white/90 font-thai">
                {hotelPhone}
              </span>
            </div>

            {/* Email — จาก hotel_information.hotel_email */}
            <div className="flex items-start gap-3">
              <MailIcon className="w-5 h-5 shrink-0 text-green-500" aria-hidden />
              <span className="text-base font-normal text-white/90 font-thai">
                {hotelEmail}
              </span>
            </div>

            {/* Address — จาก hotel_information.hotel_location */}
            <div className="flex items-start gap-3">
              <LocationIcon className="w-5 h-5 shrink-0 text-green-500" aria-hidden />
              <span className="text-base font-normal text-white/90 font-thai">
                {hotelLocation}
              </span>
            </div>
          </div>
        </div>
        </div>

        {/* Separator */}
        <div className="border-t border-white/20 my-8"></div>

        {/* Bottom Section: Social Media & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Social Media Icons */}
          <div className="flex items-center gap-4">
            <SocialIcon className="w-25 h-6 shrink-0" aria-hidden />
          </div>

          {/* Copyright */}
          <div className="text-sm font-normal text-white/90 font-sans">
            Copyright ©2022 Neatly Hotel
          </div>
        </div>
      </div>
    </footer>
  );
}
