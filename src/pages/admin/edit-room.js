"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import SideBarAdmin from "@/components/layout/SideBarAdmin";
import { supabase } from "@/lib/supabase";
import { useAmenitiesModal } from "@/hooks/useAmenitiesModal";
import { useMainImage } from "@/hooks/useMainImage";
import { useGalleryNewFiles } from "@/hooks/useGalleryNewFiles";
import AmenitiesModal from "@/components/admin/AmenitiesModal";
import Button from "@/components/ui/buttons/buttons";

const BED_OPTIONS = [
  { value: "single", label: "Single bed" },
  { value: "double", label: "Double bed" },
  { value: "king", label: "Double bed (king size)" },
  { value: "twin", label: "Twin bed" },
];


function formatPriceInput(value) {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parsePriceString(str) {
  if (str == null || String(str).trim() === "") return null;
  const n = parseFloat(String(str).replace(/,/g, "").trim());
  return Number.isNaN(n) ? null : n;
}

export default function EditRoom() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [initialTotalRooms, setInitialTotalRooms] = useState(1);
  const [bedTypeId, setBedTypeId] = useState(null);
  const [form, setForm] = useState({
    roomType: "",
    roomSize: "",
    bedType: "double",
    guests: "2",
    kids: "0",
    totalRooms: "1",
    pricePerNight: "",
    promotionChecked: false,
    promotionPrice: "",
    description: "",
    amenities: [""],
  });
  const [mainImageUrl, setMainImageUrl] = useState(null);
  const [galleryExisting, setGalleryExisting] = useState([]);
  const [galleryRemoveIds, setGalleryRemoveIds] = useState([]);
  const [galleryDragItem, setGalleryDragItem] = useState(null);
  const [existingDropTargetIndex, setExistingDropTargetIndex] = useState(null);
  const [amenityDragIndex, setAmenityDragIndex] = useState(null);
  const [amenityDropTargetIndex, setAmenityDropTargetIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const amenitiesModal = useAmenitiesModal(setAmenitiesList);
  const mainImage = useMainImage({ initialUrl: mainImageUrl, setInitialUrl: setMainImageUrl });
  const galleryNew = useGalleryNewFiles();

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev || !prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearAmenityError = (index) => {
    setErrors((prev) => {
      const map = prev?.amenities;
      if (!map || !map[index]) return prev;
      const nextAmenities = { ...map };
      delete nextAmenities[index];
      const next = { ...prev, amenities: nextAmenities };
      if (Object.keys(nextAmenities).length === 0) delete next.amenities;
      return next;
    });
  };

  const validate = () => {
    const next = {};

    if (!form.roomType?.trim()) next.roomType = true;
    if (!form.roomSize?.trim() || !/^\d+$/.test(form.roomSize.trim()) || Number(form.roomSize) <= 0) next.roomSize = true;
    if (!form.bedType?.trim()) next.bedType = true;
    if (!form.guests?.trim() || !/^\d+$/.test(form.guests.trim()) || Number(form.guests) <= 0) next.guests = true;
    if (!form.kids?.trim() || !/^-?\d+$/.test(form.kids.trim()) || !Number.isInteger(Number(form.kids)) || Number(form.kids) < 0) next.kids = true;
    if (!form.totalRooms?.trim() || !/^\d+$/.test(form.totalRooms.trim()) || Number(form.totalRooms) < initialTotalRooms) next.totalRooms = true;

    const priceNum = parsePriceString(form.pricePerNight);
    if (!form.pricePerNight?.trim() || priceNum === null || priceNum <= 0) next.pricePerNight = true;
    if (form.promotionChecked) {
      const promoNum = parsePriceString(form.promotionPrice);
      if (!form.promotionPrice?.trim() || promoNum === null || promoNum <= 0) {
        next.promotionPrice = true;
      } else if (!next.pricePerNight && priceNum !== null && promoNum >= priceNum) {
        next.promotionPrice = true;
      }
    }

    if (!form.description?.trim()) next.description = true;

    if (!mainImageUrl && !mainImage.file) next.mainImage = true;

    const existingCount = galleryExisting.filter((g) => !galleryRemoveIds.includes(g.id)).length;
    const newCount = galleryNew.files?.length ?? 0;
    if (existingCount + newCount < 4) next.gallery = true;

    const amenityErrors = {};
    (form.amenities ?? []).forEach((a, idx) => {
      if (!String(a ?? "").trim()) amenityErrors[idx] = true;
    });
    if (Object.keys(amenityErrors).length > 0) next.amenities = amenityErrors;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/admin/room-type/${id}`)
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to load room");
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        if (!json?.data) {
          setNotFound(true);
          return;
        }
        const r = json.data;
        // Check "king" before "double" to avoid "Double Bed (king size)" matching "double" first
        const BED_OPTIONS_ORDERED = ["king", "single", "twin", "double"];
        const bedValue =
          BED_OPTIONS_ORDERED.find(
            (v) =>
              r.bed_type?.name &&
              r.bed_type.name.toLowerCase().includes(v.toLowerCase())
          ) || "double";
        setBedTypeId(r.bed_type_id || null);
        setForm({
          roomType: r.name || "",
          roomSize: r.room_size != null ? String(r.room_size) : "",
          bedType: bedValue,
          guests: r.room_guest_adult != null ? String(r.room_guest_adult) : "2",
          kids: r.room_guest_kid != null ? String(r.room_guest_kid) : "0",
          totalRooms: r.total_rooms != null ? String(r.total_rooms) : "1",
          pricePerNight:
            r.price_per_night != null ? formatPriceInput(r.price_per_night) : "",
          promotionChecked: r.promotion_price != null && r.promotion_price !== "",
          promotionPrice:
            r.promotion_price != null ? formatPriceInput(r.promotion_price) : "",
          description: r.description || "",
          amenities:
            Array.isArray(r.amenities) && r.amenities.length > 0
              ? r.amenities
              : [""],
        });
        setInitialTotalRooms(
          r.total_rooms != null && !Number.isNaN(Number(r.total_rooms))
            ? Number(r.total_rooms)
            : 1
        );
        setMainImageUrl(r.image_main || null);
        setGalleryExisting(r.image_gallery || []);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    fetch("/api/admin/amenities-list")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json?.data)) setAmenitiesList(json.data);
      })
      .catch(() => setAmenitiesList([]));
  }, []);

  const handleAmenityChange = (index, value) => {
    clearAmenityError(index);
    setForm((f) => ({
      ...f,
      amenities: f.amenities.map((item, i) => (i === index ? value : item)),
    }));
  };
  const handleAddAmenity = () => {
    setForm((f) => ({ ...f, amenities: [...f.amenities, ""] }));
  };
  const handleRemoveAmenity = async (index) => {
    const name = form.amenities[index];
    const roomTypeId = Array.isArray(id) ? id[0] : id;

    if (name && roomTypeId) {
      try {
        await fetch("/api/admin/room-amenity-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomTypeId, amenityName: name }),
        });
      } catch (_) {
        // ignore error, still remove from UI and from next PATCH
      }
    }

    setForm((f) => ({
      ...f,
      amenities: f.amenities.filter((_, i) => i !== index),
    }));
  };

  const handleAmenityDragStart = (index, e) => {
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    setAmenityDragIndex(index);
    setAmenityDropTargetIndex(index);
  };

  const handleAmenityDragOver = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (amenityDragIndex == null) return;
    setAmenityDropTargetIndex(index);
  };

  const handleAmenityDrop = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    const from = amenityDragIndex;
    if (from == null || from === index) {
      setAmenityDragIndex(null);
      setAmenityDropTargetIndex(null);
      return;
    }
    setForm((f) => {
      const arr = [...f.amenities];
      const [moved] = arr.splice(from, 1);
      arr.splice(index, 0, moved);
      return { ...f, amenities: arr };
    });
    setAmenityDragIndex(null);
    setAmenityDropTargetIndex(null);
  };

  const handleAmenityDragEnd = () => {
    setAmenityDragIndex(null);
    setAmenityDropTargetIndex(null);
  };

  const handleGalleryItemDragStart = (type, index, e) => {
    if (type === "new") {
      galleryNew.handleItemDragStart(index, e);
      return;
    }
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    setGalleryDragItem({ type, index });
    setExistingDropTargetIndex(index);
  };

  const handleGalleryItemDragOver = (type, index, e) => {
    if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    if (type === "new") {
      galleryNew.handleItemDragOver(index, e);
      return;
    }
    if (!galleryDragItem || galleryDragItem.type !== "existing") return;
    setExistingDropTargetIndex(index);
  };

  const handleGalleryItemDrop = (type, toIndex, e) => {
    if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    if (type === "new") {
      galleryNew.handleItemDrop(toIndex, e);
      return;
    }
    const from = galleryDragItem?.index;
    if (from == null || from === toIndex) {
      setGalleryDragItem(null);
      setExistingDropTargetIndex(null);
      return;
    }
    setGalleryExisting((prev) => {
      const items = [...prev];
      if (from < 0 || from >= items.length || toIndex < 0 || toIndex >= items.length) return prev;
      const [moved] = items.splice(from, 1);
      items.splice(toIndex, 0, moved);
      return items;
    });
    setGalleryDragItem(null);
    setExistingDropTargetIndex(null);
  };

  const handleExistingDragEnd = () => {
    setGalleryDragItem(null);
    setExistingDropTargetIndex(null);
  };

  const removeGalleryExisting = (galleryId) => {
    setGalleryRemoveIds((prev) => [...prev, galleryId]);
  };

  const handleUpdate = async () => {
    if (!id) return;
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    try {
      let imageMainUrl = mainImageUrl;
      if (mainImage.file) {
        const ext = mainImage.file.name.split(".").pop() || "jpg";
        const filePath = `room-types/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("nealty-profile-image")
          .upload(filePath, mainImage.file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage
          .from("nealty-profile-image")
          .getPublicUrl(filePath);
        imageMainUrl = publicData.publicUrl;
      }

      const keptGallery = galleryExisting
        .filter((g) => !galleryRemoveIds.includes(g.id))
        .map((g) => g.image_url);
      let newGalleryUrls = [];
      if (galleryNew.files.length > 0) {
        const now = Date.now();
        const rnd = Math.random().toString(36).slice(2);
        newGalleryUrls = await Promise.all(
          galleryNew.files.map(async (file, index) => {
            const ext = file.name.split(".").pop() || "jpg";
            const filePath = `room-types-gallery/${now}-${rnd}-${index}.${ext}`;
            const { error } = await supabase.storage
              .from("nealty-profile-image")
              .upload(filePath, file, { upsert: true });
            if (error) throw error;
            const { data } = supabase.storage
              .from("nealty-profile-image")
              .getPublicUrl(filePath);
            return data.publicUrl;
          })
        );
      }
      const galleryUrls = [...keptGallery, ...newGalleryUrls];

      const bedLabel = BED_OPTIONS.find((o) => o.value === form.bedType)?.label || form.bedType;
      const payload = {
        roomType: form.roomType,
        roomSize: form.roomSize,
        bedType: bedLabel,
        bedTypeId: bedTypeId,
        adults: form.guests,
        kids: form.kids,
        totalRooms:
          form.totalRooms && Number(form.totalRooms) >= initialTotalRooms
            ? form.totalRooms
            : String(initialTotalRooms),
        pricePerNight: form.pricePerNight.replace(/,/g, ""),
        promotionChecked: form.promotionChecked,
        promotionPrice: form.promotionPrice.replace(/,/g, ""),
        description: form.description,
        amenities: form.amenities.map((a) => (typeof a === "string" ? a.trim() : "")),
        imageMainUrl,
        galleryUrls,
      };

      const res = await fetch(`/api/admin/room-type/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update");
      router.push("/admin/room-property");
    } catch (err) {
      const msg = err?.message || "Failed to update room type";
      setSaveError(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/room-type/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to delete");
      setDeleteModalOpen(false);
      router.push("/admin/room-property");
    } catch (err) {
      alert(err?.message || "Failed to delete room type");
    } finally {
      setDeleting(false);
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
  if (notFound || !id) {
    return (
      <div className="flex">
        <SideBarAdmin />
        <div className="flex flex-col flex-1 bg-gray-100 min-h-screen items-center justify-center">
          <p className="text-gray-600">Room not found.</p>
          <Link href="/admin/room-property" className="mt-2 text-orange-600 hover:underline">
            Back to Room & Property
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex">
      <SideBarAdmin />
      <div className="flex flex-col flex-1 bg-gray-100 min-h-screen">
        <div className="flex-1 pt-px pb-px pl-0 pr-0 py-6 px-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full px-0">
            {/* Header: back + room name + Update */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/room-property"
                  className="p-1 rounded hover:bg-gray-100 text-gray-600"
                  aria-label="Back"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h2 className="text-xl font-semibold text-gray-900">
                  {form.roomType || "Edit Room"}
                </h2>
              </div>
              <Button
                type="button"
                onClick={handleUpdate}
                disabled={saving}
                buttonStyle="primary"
                buttonText={saving ? "Updating..." : "Update"}
                className="w-[121px] h-[48px] cursor-pointer items-center gap-2 rounded-[4px] !p-2"
              />
            </div>

            <form className="px-[60px] py-[48px] space-y-6" onSubmit={(e) => e.preventDefault()}>
              {saveError && (
                <p className="mb-4 text-sm text-red-600">{saveError}</p>
              )}

              {/* Basic Information */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Type *</label>
                    <input
                      type="text"
                      value={form.roomType}
                      onChange={(e) => {
                        clearError("roomType");
                        setForm((f) => ({ ...f, roomType: e.target.value }));
                      }}
                      className={`w-full px-3 py-2 border rounded focus:outline-none  ${
                        errors.roomType
                          ? "border-red-500 focus:ring-red-400"
                          : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                      }`}
                      placeholder="e.g. Superior Garden View"
                    />
                    {errors.roomType && (
                      <p className="mt-1 text-sm text-red-600">Please fill form</p>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room size (sqm) *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.roomSize}
                        onChange={(e) => {
                          clearError("roomSize");
                          setForm((f) => ({ ...f, roomSize: e.target.value }));
                        }}
                        className={`w-full px-3 py-2 border rounded focus:outline-none  ${
                          errors.roomSize
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                        }`}
                        placeholder="e.g. 32"
                      />
                      {errors.roomSize && (
                        <p className="mt-1 text-sm text-red-600">
                          {!form.roomSize?.trim()
                            ? "Please fill form"
                            : !/^\d+$/.test(form.roomSize.trim())
                            ? "Must be a integer number at least 1"
                            : "Must be at least 1"}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bed type *</label>
                      <select
                        value={form.bedType}
                        onChange={(e) => {
                          clearError("bedType");
                          setForm((f) => ({ ...f, bedType: e.target.value }));
                          setBedTypeId(null);
                        }}
                        className={`w-full px-3 py-2 border rounded focus:outline-none  ${
                          errors.bedType
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                        }`}
                      >
                        {BED_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      {errors.bedType && (
                        <p className="mt-1 text-sm text-red-600">Please fill form</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adult *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.guests}
                        onChange={(e) => {
                          clearError("guests");
                          setForm((f) => ({ ...f, guests: e.target.value }));
                        }}
                        className={`w-full px-3 py-2 border rounded focus:outline-none  ${
                          errors.guests
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                        }`}
                      />
                      {errors.guests && (
                        <p className="mt-1 text-sm text-red-600">
                          {!form.guests?.trim()
                            ? "Please fill form"
                            : !/^\d+$/.test(form.guests.trim())
                            ? "Must be a integer number at least 1"
                            : "Must be at least 1"}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kid(s)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.kids}
                        onChange={(e) => {
                          clearError("kids");
                          setForm((f) => ({ ...f, kids: e.target.value }));
                        }}
                        className={`w-full px-3 py-2 border rounded focus:outline-none  ${
                          errors.kids
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                        }`}
                      />
                      {errors.kids && (
                        <p className="mt-1 text-sm text-red-600">
                          {!form.kids?.trim()
                            ? "Please fill form"
                            : !/^-?\d+$/.test(form.kids.trim())
                            ? "Must be a integer number at least 1"
                            : "Cannot be negative"}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of rooms *<span className="text-[12px] pl-3">(cannot be less than before)</span></label>
                        <input
                        type="number"
                        inputMode="numeric"
                        min={initialTotalRooms}
                        value={form.totalRooms}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || Number(val) >= initialTotalRooms) {
                            clearError("totalRooms");
                            setForm((f) => ({ ...f, totalRooms: val }));
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded focus:outline-none  ${
                          errors.totalRooms
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                        }`}
                      />
                      {errors.totalRooms && (
                        <p className="mt-1 text-sm text-red-600">
                          {!form.totalRooms?.trim()
                            ? "Please fill form"
                            : !/^\d+$/.test(form.totalRooms.trim())
                            ? "Must be a integer number at least 1"
                            : "Must be at least 1"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night (THB) *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.pricePerNight}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const cleaned = raw.replace(/[^\d.,]/g, "");
                          const num = parsePriceString(cleaned);
                          if (num !== null && num < 0) return;
                          clearError("pricePerNight");
                          setForm((f) => ({ ...f, pricePerNight: cleaned }));
                        }}
                        className={`w-full px-3 py-2 border rounded focus:outline-none  ${
                          errors.pricePerNight
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                        }`}
                        placeholder="e.g. 3,000.00"
                      />
                      {errors.pricePerNight && (
                        <p className="mt-1 text-sm text-red-600">
                          {!form.pricePerNight?.trim() ? "Please fill form" : "Must be a valid number greater than 0"}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          id="edit-promotion-check"
                          checked={form.promotionChecked}
                          onChange={(e) => setForm((f) => ({ ...f, promotionChecked: e.target.checked }))}
                          className="rounded border-gray-300 text-orange-600 accent-orange-600 focus:ring-orange-500"
                        />
                        <label htmlFor="edit-promotion-check" className="text-sm font-medium text-gray-700">
                          Promotion Price
                        </label>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.promotionPrice}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const cleaned = raw.replace(/[^\d.,]/g, "");
                          const num = parsePriceString(cleaned);
                          if (num !== null && num < 0) return;
                          clearError("promotionPrice");
                          setForm((f) => ({ ...f, promotionPrice: cleaned }));
                        }}
                        disabled={!form.promotionChecked}
                        className={`w-full px-3 py-2 border rounded focus:outline-none  disabled:bg-gray-100 disabled:text-gray-500 ${
                          errors.promotionPrice
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                        }`}
                        placeholder="e.g. 2,500.00"
                      />
                      {errors.promotionPrice && (
                        <p className="mt-1 text-sm text-red-600">
                          {!form.promotionPrice?.trim()
                            ? "Please fill form"
                            : parsePriceString(form.promotionPrice) === null || parsePriceString(form.promotionPrice) <= 0
                            ? "Must be a valid number greater than 0"
                            : "Must be less than price per night"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Description *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => {
                        clearError("description");
                        setForm((f) => ({ ...f, description: e.target.value }));
                      }}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded focus:outline-none  ${
                        errors.description
                          ? "border-red-500 focus:ring-red-400"
                          : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                      }`}
                      placeholder="Describe the room..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">Please fill form</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Room Image */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Room Image</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Image *</label>
                    <div className={`relative w-[240px] h-[240px] rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-orange-400 ${errors.mainImage? "border-red-600" : "border-gray-300"}`}>
                      <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 transition-colors">
                        <input
                          ref={mainImage.inputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={mainImage.handleChange}
                        />
                        {mainImage.displayUrl ? (
                          <img
                            src={mainImage.displayUrl}
                            alt="Main"
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        ) : (
                          <>
                            <span className="text-2xl text-orange-500">+</span>
                            <p className="mt-1 text-orange-500">Upload photo</p>
                          </>
                        )}
                      </label>
                      {mainImage.displayUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setErrors((prev) => ({ ...prev, mainImage: true }));
                            mainImage.handleRemove(e);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 z-10"
                          aria-label="Remove main image"
                        >
                          <span className="text-lg leading-none">×</span>
                        </button>
                      )}
                    </div>
                    {errors.mainImage && (
                      <p className="mt-1 text-sm text-red-600">Please upload picture</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image Gallery (At least 4 pictures) *
                    </label>
                    <div
                      className="flex flex-wrap gap-3"
                      onDragEnter={galleryNew.handleDragOver}
                      onDragOver={galleryNew.handleDragOver}
                      onDragLeave={galleryNew.handleDragLeave}
                      onDrop={galleryNew.handleDrop}
                    >
                      {galleryExisting
                        .filter((g) => !galleryRemoveIds.includes(g.id))
                        .map((g) => {
                          const existingIndex = galleryExisting.findIndex((item) => item.id === g.id);
                          return (
                            <div
                              key={g.id}
                              className={`relative w-[100px] h-[100px] rounded-lg overflow-hidden bg-gray-100 border cursor-pointer transition-shadow ${
                                galleryDragItem?.type === "existing" && galleryDragItem?.index === existingIndex
                                  ? "border-gray-200 opacity-40"
                                  : existingDropTargetIndex === existingIndex
                                    ? "border-orange-500 ring-2 ring-orange-400 border-2"
                                    : "border-gray-200"
                              }`}
                              draggable
                              onDragStart={(e) => handleGalleryItemDragStart("existing", existingIndex, e)}
                              onDragOver={(e) => handleGalleryItemDragOver("existing", existingIndex, e)}
                              onDrop={(e) => handleGalleryItemDrop("existing", existingIndex, e)}
                              onDragEnd={handleExistingDragEnd}
                            >
                              <img
                                src={g.image_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeGalleryExisting(g.id)}
                                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white text-sm hover:bg-red-500"
                                aria-label="Remove"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      {galleryNew.previews.map((url, index) => (
                        <div
                          key={`new-${index}`}
                          className={`relative w-[100px] h-[100px] rounded-lg overflow-hidden bg-gray-100 border cursor-pointer transition-shadow ${
                            galleryNew.dragItem?.index === index
                              ? "border-gray-200 opacity-40"
                              : galleryNew.dropTargetIndex === index
                                ? "border-orange-500 ring-2 ring-orange-400 border-2"
                                : "border-gray-200"
                          }`}
                          draggable
                          onDragStart={(e) => handleGalleryItemDragStart("new", index, e)}
                          onDragOver={(e) => handleGalleryItemDragOver("new", index, e)}
                          onDrop={(e) => handleGalleryItemDrop("new", index, e)}
                          onDragEnd={galleryNew.handleItemDragEnd}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover pointer-events-none select-none" draggable={false} />
                          <button
                            type="button"
                            onClick={() => galleryNew.removeAt(index)}
                            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white text-sm hover:bg-red-500"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <label
                        className={`w-[100px] h-[100px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-gray-500 transition-colors cursor-pointer bg-gray-50 ${errors.gallery? "border-red-600" : "border-gray-300"} ${
                          galleryNew.dragActive
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-300 hover:border-orange-400"
                        }`}
                      >
                        <input
                          ref={galleryNew.inputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            clearError("gallery");
                            galleryNew.handleChange(e);
                          }}
                        />
                        <span className="text-xl text-orange-500">+</span>
                        <span className="text-xs text-orange-500">Upload photo</span>
                      </label>
                      {errors.gallery && (
                        <p className="w-full mt-1 text-sm text-red-600">Please upload pitcures (at least 4 pictures)</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Room Amenities */}
              <section>
                <button
                  type="button"
                  onClick={amenitiesModal.openAmenitiesModal}
                  className="text-sm font-semibold text-gray-900 mb-4 block text-left hover:text-orange-600 focus:outline-none focus:ring-0"
                >
                  Room Amenities
                </button>
                <div className="space-y-4">
                  {form.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleAmenityDragStart(index, e)}
                      onDragOver={(e) => handleAmenityDragOver(index, e)}
                      onDrop={(e) => handleAmenityDrop(index, e)}
                      onDragEnd={handleAmenityDragEnd}
                      className={`space-y-1 rounded p-1 -m-1 cursor-move select-none transition-shadow ${
                        amenityDragIndex === index ? "opacity-50" : ""
                      } ${amenityDropTargetIndex === index ? "ring-2 ring-orange-500 ring-inset" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400 cursor-move select-none shrink-0 pointer-events-none">
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <circle cx="4" cy="4" r="1.2" />
                            <circle cx="10" cy="4" r="1.2" />
                            <circle cx="16" cy="4" r="1.2" />
                            <circle cx="4" cy="10" r="1.2" />
                            <circle cx="10" cy="10" r="1.2" />
                            <circle cx="16" cy="10" r="1.2" />
                            <circle cx="4" cy="16" r="1.2" />
                            <circle cx="10" cy="16" r="1.2" />
                            <circle cx="16" cy="16" r="1.2" />
                          </svg>
                        </div>
                        <label className="text-sm font-medium text-gray-700 shrink-0 whitespace-nowrap">
                          {index === 0 ? "Amenity *" : "Amenity *"}
                        </label>
                        <input
                          type="text"
                          value={amenity}
                          onChange={(e) => handleAmenityChange(index, e.target.value)}
                          className={`flex-1 min-w-0 px-3 py-2 border rounded focus:outline-none  ${
                            errors?.amenities?.[index]
                              ? "border-red-500 focus:ring-red-400"
                              : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAmenity(index)}
                          className="shrink-0 text-sm text-gray-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                      {amenitiesList.length > 0 && (
                        <div className="ml-8 flex flex-wrap gap-2 text-xs text-gray-500">
                          {amenitiesList
                            .filter((a) => {
                              const base = String(a.name || "").toLowerCase().trim();
                              const usedNames = (form.amenities || [])
                                .map((n) =>
                                  typeof n === "string" ? n.trim().toLowerCase() : ""
                                )
                                .filter(Boolean);
                              if (usedNames.includes(base)) return false;
                              if (amenity) {
                                const current = amenity.toLowerCase().trim();
                                return base.includes(current);
                              }
                              return true;
                            })
                            .slice(0, 8)
                            .map((a) => (
                              <button
                                key={a.id ?? a.name}
                                type="button"
                                onClick={() => handleAmenityChange(index, a.name)}
                                className="px-2 py-0.5 border border-gray-300 rounded-full bg-white hover:border-orange-500 hover:text-orange-600"
                              >
                                {a.name}
                              </button>
                            ))}
                        </div>
                      )}
                      {errors?.amenities?.[index] && (
                        <p className="ml-8 mt-1 text-sm text-red-600">Please fill form</p>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddAmenity}
                    className="inline-flex items-center px-4 py-2 border border-orange-500 text-orange-600 rounded hover:bg-orange-50 text-sm font-medium"
                  >
                    + Add Amenity
                  </button>
                </div>
              </section>

              <AmenitiesModal
                open={amenitiesModal.amenitiesModalOpen}
                onClose={amenitiesModal.closeAmenitiesModal}
                modalAmenitiesList={amenitiesModal.modalAmenitiesList}
                modalLoading={amenitiesModal.modalLoading}
                editAmenityTarget={amenitiesModal.editAmenityTarget}
                editAmenityName={amenitiesModal.editAmenityName}
                setEditAmenityName={amenitiesModal.setEditAmenityName}
                editAmenitySaving={amenitiesModal.editAmenitySaving}
                deleteAmenityTarget={amenitiesModal.deleteAmenityTarget}
                deleteAmenitySaving={amenitiesModal.deleteAmenitySaving}
                handleModalDeleteAmenity={amenitiesModal.handleModalDeleteAmenity}
                handleModalDeleteAmenityCancel={amenitiesModal.handleModalDeleteAmenityCancel}
                handleModalDeleteAmenityConfirm={amenitiesModal.handleModalDeleteAmenityConfirm}
                handleModalEditAmenity={amenitiesModal.handleModalEditAmenity}
                handleModalEditAmenityCancel={amenitiesModal.handleModalEditAmenityCancel}
                handleModalEditAmenitySave={amenitiesModal.handleModalEditAmenitySave}
              />

              {/* Delete Room */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={deleting}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 cursor-pointer"
                >
                  Delete Room
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    {deleteModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Delete Room</h3>
            <button
              type="button"
              onClick={() => !deleting && setDeleteModalOpen(false)}
              className="p-1 w-10 rounded hover:bg-gray-100 hover:cursor-pointer text-gray-500"
              aria-label="Close delete dialog"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
          <div className="px-6 pb-5 text-center">
            <p className="text-sm text-gray-700 text-left">Are you sure you want to delete this room?</p>
          </div>
          <div className="px-6 pb-5 flex  gap-3 items-center justify-center">
            <button
              type="button"
              onClick={handleDeleteRoom}
              disabled={deleting}
              className="btn btn-secondary w-[220px] h-[48px] whitespace-nowrap"
            >
              {deleting ? "Deleting..." : "Yes, I want to delete"}
            </button>
            <button
              type="button"
              onClick={() => !deleting && setDeleteModalOpen(false)}
              disabled={deleting}
              className="btn btn-primary h-[48px]"
            >
              No, I don’t
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
