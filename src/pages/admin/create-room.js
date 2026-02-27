"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import SideBarAdmin from "@/components/layout/SideBarAdmin";
import { supabase } from "@/lib/supabase";

const BED_OPTIONS = [
  { value: "", label: "Select bed type" },
  { value: "double", label: "Double bed" },
  { value: "single", label: "Single bed" },
  { value: "king", label: "King bed" },
];

export default function CreateRoom() {
  const router = useRouter();
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);
  const [modalAmenitiesList, setModalAmenitiesList] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [editAmenityTarget, setEditAmenityTarget] = useState(null);
  const [editAmenityName, setEditAmenityName] = useState("");
  const [editAmenitySaving, setEditAmenitySaving] = useState(false);
  const [deleteAmenityTarget, setDeleteAmenityTarget] = useState(null);
  const [deleteAmenitySaving, setDeleteAmenitySaving] = useState(false);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [mainImageFile, setMainImageFile] = useState(null);
  const mainImageInputRef = useRef(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const galleryInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState({
    roomType: "",
    roomSize: "",
    bedType: "double",
    adults: "2",
    kids: "0",
    roomCount: "1",
    pricePerNight: "",
    promotionChecked: false,
    promotionPrice: "",
    description: "",
    amenities: [""],
  });

  useEffect(() => {
    fetch("/api/admin/amenities-list")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json?.data)) {
          setAmenitiesList(json.data);
        } else {
          setAmenitiesList([]);
        }
      })
      .catch(() => setAmenitiesList([]));
  }, []);

  const fetchModalAmenities = () => {
    setModalLoading(true);
    fetch("/api/admin/amenities-list")
      .then((res) => res.json())
      .then((json) => {
        setModalAmenitiesList(Array.isArray(json?.data) ? json.data : []);
      })
      .catch(() => setModalAmenitiesList([]))
      .finally(() => setModalLoading(false));
  };

  const openAmenitiesModal = () => {
    setAmenitiesModalOpen(true);
    fetchModalAmenities();
  };

  const closeAmenitiesModal = () => {
    setAmenitiesModalOpen(false);
    fetch("/api/admin/amenities-list")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json?.data)) setAmenitiesList(json.data);
      })
      .catch(() => {});
  };

  const handleModalDeleteAmenity = (amenity) => {
    setDeleteAmenityTarget(amenity);
  };

  const handleModalDeleteAmenityCancel = () => {
    if (deleteAmenitySaving) return;
    setDeleteAmenityTarget(null);
  };

  const handleModalDeleteAmenityConfirm = async () => {
    if (!deleteAmenityTarget) return;
    setDeleteAmenitySaving(true);
    try {
      const res = await fetch(`/api/admin/amenities/${deleteAmenityTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to delete");
      fetchModalAmenities();
      setDeleteAmenityTarget(null);
    } catch (err) {
      alert(err?.message || "ไม่สามารถลบได้");
    } finally {
      setDeleteAmenitySaving(false);
    }
  };

  const handleModalEditAmenity = (amenity) => {
    setEditAmenityTarget(amenity);
    setEditAmenityName(amenity?.name ?? "");
  };

  const handleModalEditAmenityCancel = () => {
    if (editAmenitySaving) return;
    setEditAmenityTarget(null);
    setEditAmenityName("");
  };

  const handleModalEditAmenitySave = async () => {
    if (!editAmenityTarget) return;
    const trimmed = editAmenityName.trim();
    const current = editAmenityTarget.name ?? "";
    if (!trimmed || trimmed === current) {
      handleModalEditAmenityCancel();
      return;
    }
    setEditAmenitySaving(true);
    try {
      const res = await fetch(`/api/admin/amenities/${editAmenityTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update");
      fetchModalAmenities();
      setEditAmenityTarget(null);
      setEditAmenityName("");
    } catch (err) {
      alert(err?.message || "ไม่สามารถแก้ไขได้");
    } finally {
      setEditAmenitySaving(false);
    }
  };

  const handleAmenityChange = (index, value) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleAddAmenity = () => {
    setForm((f) => ({
      ...f,
      amenities: [...f.amenities, ""],
    }));
  };

  const handleRemoveAmenity = (index) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.filter((_, i) => i !== index),
    }));
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("The file is too large. Please upload an image smaller than 5MB.");
      return;
    }
    if (mainImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(mainImagePreview);
    }
    const url = URL.createObjectURL(file);
    setMainImagePreview(url);
    setMainImageFile(file);
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxSize = 5 * 1024 * 1024;
    const validFiles = [];
    const previews = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > maxSize) return;
      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    });

    if (!validFiles.length) {
      alert("Please upload valid image files (max 5MB each).");
      return;
    }

    galleryPreviews.forEach((url) => {
      if (typeof url === "string" && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });

    setGalleryFiles(validFiles);
    setGalleryPreviews(previews);
  };

  const handleCreate = async () => {
    if (!form.roomType.trim()) {
      alert("Please fill in Room Type.");
      return;
    }
    if (!form.pricePerNight.trim()) {
      alert("Please fill in Price per Night.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      let imageMainUrl = null;
      let galleryUrls = [];

      if (mainImageFile) {
        const ext = mainImageFile.name.split(".").pop();
        const safeExt = ext || "jpg";
        const filePath = `room-types/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${safeExt}`;

        const { error: uploadError } = await supabase.storage
          .from("nealty-profile-image")
          .upload(filePath, mainImageFile, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } = supabase.storage
          .from("nealty-profile-image")
          .getPublicUrl(filePath);

        imageMainUrl = publicData.publicUrl;
      }

      if (galleryFiles.length > 0) {
        const now = Date.now();
        const randomBase = Math.random().toString(36).slice(2);

        const uploaded = await Promise.all(
          galleryFiles.map(async (file, index) => {
            const ext = file.name.split(".").pop();
            const safeExt = ext || "jpg";
            const filePath = `room-types-gallery/${now}-${randomBase}-${index}.${safeExt}`;

            const { error: uploadError } = await supabase.storage
              .from("nealty-profile-image")
              .upload(filePath, file, { upsert: true });

            if (uploadError) {
              throw uploadError;
            }

            const { data: publicData } = supabase.storage
              .from("nealty-profile-image")
              .getPublicUrl(filePath);

            return publicData.publicUrl;
          })
        );

        galleryUrls = uploaded.filter(Boolean);
      }

      const payload = {
        roomType: form.roomType,
        roomSize: form.roomSize,
        bedType: form.bedType,
        adults: form.adults,
        kids: form.kids,
        roomCount: form.roomCount,
        pricePerNight: form.pricePerNight,
        promotionChecked: form.promotionChecked,
        promotionPrice: form.promotionPrice,
        description: form.description,
        amenities: form.amenities.map((a) =>
          typeof a === "string" ? a.trim() : ""
        ),
        imageMainUrl,
        galleryUrls,
      };

      const res = await fetch("/api/admin/room-types-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to create room type");
      }

      router.push("/admin/room-property");
    } catch (err) {
      const message = err?.message || "Failed to create room type";
      setSaveError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex">
      <SideBarAdmin />
      <div className="flex flex-col flex-1 bg-gray-100 min-h-screen">
        <div className="flex-1 pt-px pb-px pl-0 pr-0 py-6 px-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full px-0">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New Room</h2>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/room-property"
                  className="px-4 py-2 rounded border border-orange-500 text-orange-600 font-medium hover:bg-orange-50"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="px-4 py-2 rounded bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </div>
            <form className="p-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
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
                      onChange={(e) => setForm((f) => ({ ...f, roomType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room size(sqm) *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.roomSize}
                        onChange={(e) => setForm((f) => ({ ...f, roomSize: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bed type *</label>
                      <select
                        value={form.bedType}
                        onChange={(e) => setForm((f) => ({ ...f, bedType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        {BED_OPTIONS.map((o) => (
                          <option key={o.value || "empty"} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adult *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.adults}
                        onChange={(e) => setForm((f) => ({ ...f, adults: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kid *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.kids}
                        onChange={(e) => setForm((f) => ({ ...f, kids: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนห้องที่จะเพิ่ม *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.roomCount}
                        onChange={(e) => setForm((f) => ({ ...f, roomCount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g. 1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night(THB) *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.pricePerNight}
                        onChange={(e) => setForm((f) => ({ ...f, pricePerNight: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          id="promotion-check"
                          checked={form.promotionChecked}
                          onChange={(e) => setForm((f) => ({ ...f, promotionChecked: e.target.checked }))}
                          className="rounded border-gray-300 text-orange-600 accent-orange-600 focus:ring-orange-500"
                        />
                        <label htmlFor="promotion-check" className="text-sm font-medium text-gray-700">Promotion Price</label>
                        <span className="text-gray-400 text-xs" title="if not check = disable field">if not check = disable field</span>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.promotionPrice}
                        onChange={(e) => setForm((f) => ({ ...f, promotionPrice: e.target.value }))}
                        disabled={!form.promotionChecked}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Description *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Describe the room..."
                    />
                  </div>
                </div>
              </section>

              {/* Room Image */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Room Image</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Image *</label>
                    <label
                      className="relative border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 hover:border-orange-400 transition-colors cursor-pointer w-[240px] h-[240px] flex flex-col items-center justify-center overflow-hidden bg-gray-100"
                    >
                      <input
                        ref={mainImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleMainImageChange}
                      />
                      {mainImagePreview ? (
                        <img
                          src={mainImagePreview}
                          alt="Main"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <span className="text-2xl text-orange-500">+</span>
                          <p className="mt-1 text-orange-500">Upload photo</p>
                        </>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image Gallery (At least 4 pictures) *
                    </label>
                    <label className="w-[167px] h-[167px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 hover:border-orange-400 transition-colors cursor-pointer overflow-hidden bg-gray-100">
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleGalleryChange}
                      />
                      {galleryPreviews.length > 0 ? (
                        <div className="flex flex-col items-center justify-center px-2 text-xs text-gray-700">
                          <span className="font-medium">
                            {galleryPreviews.length} image{galleryPreviews.length > 1 ? "s" : ""} selected
                          </span>
                          <span className="mt-1 text-[11px] text-gray-500">Click to change</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-2xl text-orange-500">+</span>
                          <p className="mt-1 text-orange-500">Upload photo</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </section>

              {/* Room Amenities */}
              <section>
                <button
                  type="button"
                  onClick={openAmenitiesModal}
                  className="text-sm font-semibold text-gray-900 mb-4 block text-left hover:text-orange-600 focus:outline-none focus:ring-0"
                >
                  Room Amenities
                </button>
                <div className="space-y-4">
                  {form.amenities.map((amenity, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="text-gray-400 cursor-move select-none shrink-0">
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
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
                          Amenity *
                        </label>
                        <input
                          type="text"
                          value={amenity}
                          onChange={(e) => handleAmenityChange(index, e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                                .map((n) => (typeof n === "string" ? n.trim().toLowerCase() : ""))
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

              {/* Modal: จัดการ Amenities ทั้งหมด */}
              {amenitiesModalOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                  onClick={(e) => e.target === e.currentTarget && closeAmenitiesModal()}
                >
                  <div
                    className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                      <h3 className="text-lg font-semibold text-gray-900">จัดการ Amenities</h3>
                      <button
                        type="button"
                        onClick={closeAmenitiesModal}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500"
                        aria-label="ปิด"
                      >
                        <span className="text-xl leading-none">×</span>
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1">
                      {modalLoading ? (
                        <p className="text-sm text-gray-500">กำลังโหลด...</p>
                      ) : (
                        <ul className="space-y-2">
                          {modalAmenitiesList.map((a) => (
                            <li
                              key={a.id}
                              className="flex items-center justify-between py-2 px-3 rounded border border-gray-200 hover:bg-gray-50"
                            >
                              <span className="text-sm text-gray-900">{a.name}</span>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleModalEditAmenity(a)}
                                  className="text-sm text-gray-500 hover:text-orange-600"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleModalDeleteAmenity(a)}
                                  className="text-sm text-gray-500 hover:text-red-600 hover:cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </li>
                          ))}
                          {modalAmenitiesList.length === 0 && !modalLoading && (
                            <li className="text-sm text-gray-500 py-4">ยังไม่มีรายการ</li>
                          )}
                        </ul>
                      )}
                    </div>
                    <div className="border-t border-gray-200 px-6 py-3 flex justify-end">
                      <button
                        type="button"
                        onClick={closeAmenitiesModal}
                        className="px-4 py-2 rounded border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                      >
                        ปิด
                      </button>
                    </div>

                    {editAmenityTarget && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">
                            Edit Amenity
                          </h4>
                          <input
                            type="text"
                            value={editAmenityName}
                            onChange={(e) => setEditAmenityName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleModalEditAmenitySave();
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                          <div className="mt-4 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleModalEditAmenityCancel}
                              disabled={editAmenitySaving}
                              className="px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleModalEditAmenitySave}
                              disabled={editAmenitySaving || !editAmenityName.trim()}
                              className="px-3 py-1.5 rounded bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                            >
                              {editAmenitySaving ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {deleteAmenityTarget && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">
                            Delete Amenity
                          </h4>
                          <p className="text-sm text-gray-700 mb-4">
                            Delete this amenity from the entire system (it will be removed from all rooms).
                          </p>
                          <p className="text-sm font-medium text-gray-900 mb-4">
                            {deleteAmenityTarget.name}
                          </p>
                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleModalDeleteAmenityCancel}
                              disabled={deleteAmenitySaving}
                              className="px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleModalDeleteAmenityConfirm}
                              disabled={deleteAmenitySaving}
                              className="px-3 py-1.5 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                              {deleteAmenitySaving ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
