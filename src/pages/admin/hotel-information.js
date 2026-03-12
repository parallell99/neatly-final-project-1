"use client";

import { useState, useEffect, useRef } from "react";
import SideBarAdmin from "@/components/layout/SideBarAdmin";
import { supabase } from "@/lib/supabase";

const DEFAULT_DESCRIPTION =
  "Set in Bangkok, Thailand. Neatly Hotel offers 5-star accommodation with an outdoor pool, kids' club, sports facilities and a fitness centre. There is also a spa, an indoor pool and saunas.\n\nAll units at the hotel are equipped with a seating area, a flat-screen TV with satellite channels, a dining area and a private bathroom with free toiletries, a bathtub and a hairdryer. Every room in Neatly Hotel features a furnished balcony. Some rooms are equipped with a coffee machine.\n\nFree WIFI and entertainment facilities are available at property and also rentals are provided to explore the area.";

export default function HotelInformation() {
  const [hotelName, setHotelName] = useState("Neatly Hotel");
  const [hotelDescription, setHotelDescription] = useState(DEFAULT_DESCRIPTION);
  const [hotelLogoUrl, setHotelLogoUrl] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [hotelLogoFooterUrl, setHotelLogoFooterUrl] = useState(null);
  const [logoFooterFile, setLogoFooterFile] = useState(null);
  const [logoFooterPreview, setLogoFooterPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [rowExists, setRowExists] = useState(false);
  const [hotelBgUrl, setHotelBgUrl] = useState(null);
  const [bgFile, setBgFile] = useState(null);
  const [bgPreview, setBgPreview] = useState(null);
  const [hotelPhone, setHotelPhone] = useState("");
  const [hotelEmail, setHotelEmail] = useState("");
  const [hotelLocation, setHotelLocation] = useState("");
  const [hotelMainText, setHotelMainText] = useState("");
  const [hotelFooterDescription, setHotelFooterDescription] = useState("");
  const logoInputRef = useRef(null);
  const logoFooterInputRef = useRef(null);
  const bgInputRef = useRef(null);

  const displayLogoUrl = logoPreview || hotelLogoUrl;
  const displayLogoFooterUrl = logoFooterPreview || hotelLogoFooterUrl;
  const displayBgUrl = bgPreview || hotelBgUrl;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/admin/hotel-information")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const d = json?.data;
        if (d) {
          setHotelName(d.hotelName ?? "Neatly Hotel");
          setHotelDescription(d.hotelDescription ?? DEFAULT_DESCRIPTION);
          setHotelLogoUrl(d.hotelLogoUrl ?? null);
          setHotelLogoFooterUrl(d.hotelLogoFooterUrl ?? null);
          setHotelBgUrl(d.hotelBgUrl ?? null);
          setHotelPhone(d.hotelPhone ?? "");
          setHotelEmail(d.hotelEmail ?? "");
          setHotelLocation(d.hotelLocation ?? "");
          setHotelMainText(d.hotelMainText ?? "");
          setHotelFooterDescription(d.hotelFooterDescription ?? "");
        }
        setRowExists(!!json?.rowExists);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!logoFooterFile) {
      setLogoFooterPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFooterFile);
    setLogoFooterPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFooterFile]);

  useEffect(() => {
    if (!bgFile) {
      setBgPreview(null);
      return;
    }
    const url = URL.createObjectURL(bgFile);
    setBgPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bgFile]);

  const handleBgChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setBgFile(file);
    if (bgInputRef.current) bgInputRef.current.value = "";
  };

  const handleBgRemove = () => {
    setBgFile(null);
    setHotelBgUrl(null);
    setBgPreview(null);
    if (bgInputRef.current) bgInputRef.current.value = "";
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setLogoFile(file);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setHotelLogoUrl(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleLogoFooterChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setLogoFooterFile(file);
    if (logoFooterInputRef.current) logoFooterInputRef.current.value = "";
  };

  const handleLogoFooterRemove = () => {
    setLogoFooterFile(null);
    setHotelLogoFooterUrl(null);
    setLogoFooterPreview(null);
    if (logoFooterInputRef.current) logoFooterInputRef.current.value = "";
  };

  const handleUpdate = async () => {
    if (!hotelName?.trim()) {
      setError("Hotel name is required.");
      return;
    }
    if (!hotelDescription?.trim()) {
      setError("Hotel description is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let finalLogoUrl = hotelLogoUrl;
      let finalLogoFooterUrl = hotelLogoFooterUrl;

      if (logoFile) {
        const ext = (logoFile.name.split(".").pop() || "png").toLowerCase();
        const path = `hotel-info/logo-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("nealty-profile-image")
          .upload(path, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage
          .from("nealty-profile-image")
          .getPublicUrl(path);
        finalLogoUrl = publicData.publicUrl;
      }

      if (logoFooterFile) {
        const ext = (logoFooterFile.name.split(".").pop() || "png").toLowerCase();
        const path = `hotel-info/logo-footer-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("nealty-profile-image")
          .upload(path, logoFooterFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage
          .from("nealty-profile-image")
          .getPublicUrl(path);
        finalLogoFooterUrl = publicData.publicUrl;
      }

      let finalBgUrl = hotelBgUrl;
      if (bgFile) {
        const ext = (bgFile.name.split(".").pop() || "png").toLowerCase();
        const path = `hotel-info/bg-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("nealty-profile-image")
          .upload(path, bgFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage
          .from("nealty-profile-image")
          .getPublicUrl(path);
        finalBgUrl = publicData.publicUrl;
      }

      const method = rowExists ? "PUT" : "POST";
      const res = await fetch("/api/admin/hotel-information", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelName: hotelName.trim(),
          hotelDescription: hotelDescription.trim(),
          hotelLogoUrl: finalLogoUrl,
          hotelLogoFooterUrl: finalLogoFooterUrl,
          hotelBgUrl: finalBgUrl,
          hotelPhone: hotelPhone.trim() || null,
          hotelEmail: hotelEmail.trim() || null,
          hotelLocation: hotelLocation.trim() || null,
          hotelMainText: hotelMainText.trim() || null,
          hotelFooterDescription: hotelFooterDescription.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setRowExists(true);
          setError(json?.error || "Data already exists. Refresh the page then try Update again.");
          setSaving(false);
          return;
        }
        if (res.status === 400 && json?.missingColumnsSql) {
          setError(
            (json?.error || "อัปเดตไม่ได้") +
              "\n\nรัน SQL นี้ใน Supabase → SQL Editor:\n\n" +
              json.missingColumnsSql
          );
          setSaving(false);
          return;
        }
        throw new Error(json?.error || (rowExists ? "Update failed" : "Create failed"));
      }

      setHotelLogoUrl(json?.data?.hotelLogoUrl ?? finalLogoUrl);
      setLogoFile(null);
      setLogoPreview(null);
      setHotelLogoFooterUrl(json?.data?.hotelLogoFooterUrl ?? finalLogoFooterUrl);
      setLogoFooterFile(null);
      setLogoFooterPreview(null);
      setHotelBgUrl(json?.data?.hotelBgUrl ?? finalBgUrl);
      setBgFile(null);
      setBgPreview(null);
      setHotelPhone(json?.data?.hotelPhone ?? hotelPhone);
      setHotelEmail(json?.data?.hotelEmail ?? hotelEmail);
      setHotelLocation(json?.data?.hotelLocation ?? hotelLocation);
      setHotelMainText(json?.data?.hotelMainText ?? hotelMainText);
      setHotelFooterDescription(json?.data?.hotelFooterDescription ?? hotelFooterDescription);
      setRowExists(true);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to update");
      setSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <SideBarAdmin />
        <div className="flex flex-col flex-1 bg-gray-100 min-h-screen items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <SideBarAdmin />
      <div className="flex flex-col flex-1 bg-gray-100 min-h-screen">
        <div className="flex-1 py-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="headline-5 text-gray-900">Hotel Information</h1>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={saving}
              className="w-[120px] h-12 px-5 py-2.5 rounded bg-orange-500 hover:bg-orange-600 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              {saving ? "Updating..." : "Update"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm whitespace-pre-line">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm">
              Hotel information updated.
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotel name *</label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main text</label>
              
              <textarea
                value={hotelMainText ?? ""}
                onChange={(e) => setHotelMainText(e.target.value)}
                placeholder="A Best Place for Your Neatly Experience"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-y"
                aria-label="Hero main text — saves to hotel_information.hotel_main_text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotel description *</label>
              <textarea
                value={hotelDescription}
                onChange={(e) => setHotelDescription(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Hotel contact information — from hotel_information.hotel_phone, hotel_email, hotel_location */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Hotel contact information</label>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={hotelPhone ?? ""}
                  onChange={(e) => setHotelPhone(e.target.value)}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="Hotel phone from hotel_phone"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={hotelEmail ?? ""}
                  onChange={(e) => setHotelEmail(e.target.value)}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="Hotel email from hotel_email"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <textarea
                  value={hotelLocation ?? ""}
                  onChange={(e) => setHotelLocation(e.target.value)}
                  rows={3}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="Hotel location from hotel_location"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Footer description</label>
                <textarea
                  value={hotelFooterDescription ?? ""}
                  onChange={(e) => setHotelFooterDescription(e.target.value)}
                  rows={3}
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  aria-label="Hotel footer description from hotel_footter_description"
                />
                
              </div>
            </div>

            {/* Hotel background image upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotel background image</label>
              <p className="text-xs text-gray-500 mb-2">Background image for landing page .</p>
              <div className="relative w-[320px] h-[180px] rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 transition-colors">
                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBgChange}
                  />
                  {displayBgUrl ? (
                    <img
                      src={displayBgUrl}
                      alt="Hotel background"
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <>
                      <span className="text-2xl text-orange-500">+</span>
                      <p className="mt-1 text-orange-500 text-sm">Upload background</p>
                    </>
                  )}
                </label>
                {displayBgUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBgRemove();
                    }}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 z-10"
                    aria-label="Remove background"
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                )}
              </div>
            </div>

            {/* Logo and logo footer */}
            <div className="flex gap-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel logo *</label>
                <p className="text-xs text-gray-500 mb-2">Main logo.</p>
                <div className="relative w-[240px] h-[120px] rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 transition-colors">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  {displayLogoUrl ? (
                    <img
                      src={displayLogoUrl}
                      alt="Hotel logo"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  ) : (
                    <>
                      <span className="text-2xl text-orange-500">+</span>
                      <p className="mt-1 text-orange-500 text-sm">Upload logo</p>
                    </>
                  )}
                </label>
                {displayLogoUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLogoRemove();
                    }}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 z-10"
                    aria-label="Remove logo"
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                )}
              </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hotel logo footer *</label>
                  <p className="text-xs text-gray-500 mb-2">Shown in the site footer.</p>
                  <div className="relative w-[240px] h-[120px] rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 transition-colors">
                      <input
                        ref={logoFooterInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoFooterChange}
                      />
                      {displayLogoFooterUrl ? (
                        <img
                          src={displayLogoFooterUrl}
                          alt="Hotel logo footer"
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      ) : (
                        <>
                          <span className="text-2xl text-orange-500">+</span>
                          <p className="mt-1 text-orange-500 text-sm">Upload logo</p>
                        </>
                      )}
                    </label>
                    {displayLogoFooterUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLogoFooterRemove();
                        }}
                        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 z-10"
                        aria-label="Remove logo"
                      >
                        <span className="text-lg leading-none">×</span>
                      </button>
                    )}
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
