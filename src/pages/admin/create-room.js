"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import SideBarAdmin from "@/components/layout/SideBarAdmin";
import { supabase } from "@/lib/supabase";
import { useAmenitiesModal } from "@/hooks/useAmenitiesModal";
import { useMainImage } from "@/hooks/useMainImage";
import { useGalleryNewFiles } from "@/hooks/useGalleryNewFiles";
import AmenitiesModal from "@/components/admin/AmenitiesModal";

const BED_OPTIONS = [
  { value: "", label: "Select bed type" },
  { value: "double", label: "Double bed" },
  { value: "single", label: "Single bed" },
  { value: "king", label: "King bed" },
];

export default function CreateRoom() {
  const router = useRouter();
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [amenityDragIndex, setAmenityDragIndex] = useState(null);
  const [amenityDropTargetIndex, setAmenityDropTargetIndex] = useState(null);
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

  const amenitiesModal = useAmenitiesModal(setAmenitiesList);
  const mainImage = useMainImage();
  const gallery = useGalleryNewFiles();

  useEffect(() => {
    fetch("/api/admin/amenities-list")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json?.data)) setAmenitiesList(json.data);
        else setAmenitiesList([]);
      })
      .catch(() => setAmenitiesList([]));
  }, []);

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

  const handleAmenityDragStart = (index, e) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    }
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

      if (mainImage.file) {
        const ext = mainImage.file.name.split(".").pop();
        const safeExt = ext || "jpg";
        const filePath = `room-types/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${safeExt}`;

        const { error: uploadError } = await supabase.storage
          .from("nealty-profile-image")
          .upload(filePath, mainImage.file, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } = supabase.storage
          .from("nealty-profile-image")
          .getPublicUrl(filePath);

        imageMainUrl = publicData.publicUrl;
      }

      if (gallery.files.length > 0) {
        const now = Date.now();
        const randomBase = Math.random().toString(36).slice(2);

        const uploaded = await Promise.all(
          gallery.files.map(async (file, index) => {
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
                    <div className="relative w-[240px] h-[240px] rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
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
                            mainImage.handleRemove(e);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 z-10"
                          aria-label="Remove main image"
                        >
                          <span className="text-lg leading-none">×</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image Gallery (At least 4 pictures) *
                    </label>
                    <div
                      className="flex flex-wrap gap-3"
                      onDragEnter={gallery.handleDragOver}
                      onDragOver={gallery.handleDragOver}
                      onDragLeave={gallery.handleDragLeave}
                      onDrop={gallery.handleDrop}
                    >
                      {gallery.previews.map((url, index) => (
                        <div
                          key={`gallery-${index}`}
                          className={`relative w-[100px] h-[100px] rounded-lg overflow-hidden bg-gray-100 border cursor-pointer transition-shadow ${
                            gallery.dragItem?.index === index
                              ? "border-gray-200 opacity-40"
                              : gallery.dropTargetIndex === index
                                ? "border-orange-500 ring-2 ring-orange-400 border-2"
                                : "border-gray-200"
                          }`}
                          draggable
                          onDragStart={(e) => gallery.handleItemDragStart(index, e)}
                          onDragOver={(e) => gallery.handleItemDragOver(index, e)}
                          onDrop={(e) => gallery.handleItemDrop(index, e)}
                          onDragEnd={gallery.handleItemDragEnd}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover pointer-events-none select-none" draggable={false} />
                          <button
                            type="button"
                            onClick={() => gallery.removeAt(index)}
                            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white text-sm hover:bg-red-500"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <label
                        className={`w-[100px] h-[100px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-gray-500 transition-colors cursor-pointer bg-gray-50 ${
                          gallery.dragActive
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-300 hover:border-orange-400"
                        }`}
                      >
                        <input
                          ref={gallery.inputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={gallery.handleChange}
                        />
                        <span className="text-xl text-orange-500">+</span>
                        <span className="text-xs text-orange-500">Upload photo</span>
                      </label>
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
