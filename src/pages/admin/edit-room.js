"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import SideBarAdmin from "@/components/layout/SideBarAdmin";
import { supabase } from "@/lib/supabase";

const BED_OPTIONS = [
  { value: "single", label: "Single bed" },
  { value: "double", label: "Double bed" },
  { value: "king", label: "Double bed (king size)" },
  { value: "twin", label: "Twin bed" },
];

const GUEST_OPTIONS = [2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }));
const KID_OPTIONS = [0, 1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }));
function formatPriceInput(value) {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EditRoom() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [amenitiesList, setAmenitiesList] = useState([]);
  const [initialTotalRooms, setInitialTotalRooms] = useState(1);
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
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [mainImageFile, setMainImageFile] = useState(null);
  const mainImageInputRef = useRef(null);
  const [galleryExisting, setGalleryExisting] = useState([]);
  const [galleryRemoveIds, setGalleryRemoveIds] = useState([]);
  const [galleryNewFiles, setGalleryNewFiles] = useState([]);
  const [galleryNewPreviews, setGalleryNewPreviews] = useState([]);
  const [galleryDragActive, setGalleryDragActive] = useState(false);
  const [galleryDragItem, setGalleryDragItem] = useState(null);
  const galleryInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);
  const [modalAmenitiesList, setModalAmenitiesList] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [editAmenityTarget, setEditAmenityTarget] = useState(null);
  const [editAmenityName, setEditAmenityName] = useState("");
  const [editAmenitySaving, setEditAmenitySaving] = useState(false);
  const [deleteAmenityTarget, setDeleteAmenityTarget] = useState(null);
  const [deleteAmenitySaving, setDeleteAmenitySaving] = useState(false);

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
        const bedValue =
          BED_OPTIONS.find(
            (o) =>
              r.bed_type?.name &&
              r.bed_type.name.toLowerCase().includes(o.value.toLowerCase())
          )?.value || "double";
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
      const res = await fetch(`/api/admin/amenities/${deleteAmenityTarget.id}`, { method: "DELETE" });
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

  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Please upload an image smaller than 5MB.");
      return;
    }
    if (mainImagePreview?.startsWith("blob:")) URL.revokeObjectURL(mainImagePreview);
    setMainImagePreview(URL.createObjectURL(file));
    setMainImageFile(file);
  };
  const handleRemoveMainImage = (e) => {
    e?.preventDefault?.();
    if (mainImagePreview?.startsWith("blob:")) URL.revokeObjectURL(mainImagePreview);
    setMainImagePreview(null);
    setMainImageFile(null);
    setMainImageUrl(null);
    if (mainImageInputRef.current) mainImageInputRef.current.value = "";
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const maxSize = 5 * 1024 * 1024;
    const valid = [];
    const previews = [];
    files.forEach((file) => {
      if (!file.type.startsWith("image/") || file.size > maxSize) return;
      valid.push(file);
      previews.push(URL.createObjectURL(file));
    });
    if (valid.length) {
      galleryNewPreviews.forEach((u) => {
        if (typeof u === "string" && u.startsWith("blob:")) URL.revokeObjectURL(u);
      });
      setGalleryNewFiles((prev) => [...prev, ...valid]);
      setGalleryNewPreviews((prev) => [...prev, ...previews]);
    }
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleGalleryDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    setGalleryDragActive(true);
  };

  const handleGalleryDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setGalleryDragActive(false);
  };

  const handleGalleryDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setGalleryDragActive(false);
    const dt = e.dataTransfer;
    if (!dt || !dt.files || !dt.files.length) return;
    handleGalleryChange({ target: { files: dt.files } });
  };

  const handleGalleryItemDragStart = (type, index, e) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
    setGalleryDragItem({ type, index });
  };

  const handleGalleryItemDragOver = (type, index, e) => {
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes("Files")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (!galleryDragItem || galleryDragItem.type !== type || galleryDragItem.index === index) return;
    if (type === "existing") {
      setGalleryExisting((prev) => {
        const items = [...prev];
        const from = galleryDragItem.index;
        const to = index;
        if (from < 0 || from >= items.length || to < 0 || to >= items.length) return prev;
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
        return items;
      });
      setGalleryDragItem({ type, index });
    } else {
      setGalleryNewFiles((prev) => {
        const filesArr = [...prev];
        const from = galleryDragItem.index;
        const to = index;
        if (from < 0 || from >= filesArr.length || to < 0 || to >= filesArr.length) return prev;
        const [movedFile] = filesArr.splice(from, 1);
        filesArr.splice(to, 0, movedFile);
        return filesArr;
      });
      setGalleryNewPreviews((prev) => {
        const previewsArr = [...prev];
        const from = galleryDragItem.index;
        const to = index;
        if (from < 0 || from >= previewsArr.length || to < 0 || to >= previewsArr.length) return prev;
        const [movedPreview] = previewsArr.splice(from, 1);
        previewsArr.splice(to, 0, movedPreview);
        return previewsArr;
      });
      setGalleryDragItem({ type, index });
    }
  };

  const handleGalleryItemDrop = (type, index, e) => {
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes("Files")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setGalleryDragItem(null);
  };
  const removeGalleryExisting = (galleryId) => {
    setGalleryRemoveIds((prev) => [...prev, galleryId]);
  };
  const removeGalleryNew = (index) => {
    setGalleryNewPreviews((prev) => {
      const u = prev[index];
      if (typeof u === "string" && u.startsWith("blob:")) URL.revokeObjectURL(u);
      return prev.filter((_, i) => i !== index);
    });
    setGalleryNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (!id) return;
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
      let imageMainUrl = mainImageUrl;
      if (mainImageFile) {
        const ext = mainImageFile.name.split(".").pop() || "jpg";
        const filePath = `room-types/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("nealty-profile-image")
          .upload(filePath, mainImageFile, { upsert: true });
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
      if (galleryNewFiles.length > 0) {
        const now = Date.now();
        const rnd = Math.random().toString(36).slice(2);
        newGalleryUrls = await Promise.all(
          galleryNewFiles.map(async (file, index) => {
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

  const mainDisplayUrl = mainImagePreview || mainImageUrl;

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
              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving}
                className="px-4 py-2 rounded bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed w-[121px] h-[48px]"
              >
                {saving ? "Updating..." : "Update"}
              </button>
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
                      placeholder="e.g. Superior Garden View"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room size (sqm) *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.roomSize}
                        onChange={(e) => setForm((f) => ({ ...f, roomSize: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g. 32"
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
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adult *</label>
                      <select
                        value={form.guests}
                        onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        {GUEST_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kid(s)</label>
                      <select
                        value={form.kids}
                        onChange={(e) => setForm((f) => ({ ...f, kids: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        {KID_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนห้อง</label>
                      <input
                        type="number"
                        min={initialTotalRooms}
                        value={form.totalRooms}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || (Number(v) >= initialTotalRooms && Number(v) <= 999)) {
                            setForm((f) => ({ ...f, totalRooms: v }));
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night (THB) *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.pricePerNight}
                        onChange={(e) => setForm((f) => ({ ...f, pricePerNight: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g. 3,000.00"
                      />
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
                        onChange={(e) => setForm((f) => ({ ...f, promotionPrice: e.target.value }))}
                        disabled={!form.promotionChecked}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
                        placeholder="e.g. 2,500.00"
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
                          ref={mainImageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleMainImageChange}
                        />
                        {mainDisplayUrl ? (
                          <img
                            src={mainDisplayUrl}
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
                      {mainDisplayUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveMainImage(e);
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
                      onDragEnter={handleGalleryDragOver}
                      onDragOver={handleGalleryDragOver}
                      onDragLeave={handleGalleryDragLeave}
                      onDrop={handleGalleryDrop}
                    >
                      {galleryExisting
                        .filter((g) => !galleryRemoveIds.includes(g.id))
                        .map((g) => {
                          const existingIndex = galleryExisting.findIndex((item) => item.id === g.id);
                          return (
                            <div
                              key={g.id}
                              className="relative w-[100px] h-[100px] rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer"
                              draggable
                              onDragStart={(e) => handleGalleryItemDragStart("existing", existingIndex, e)}
                              onDragOver={(e) => handleGalleryItemDragOver("existing", existingIndex, e)}
                              onDrop={(e) => handleGalleryItemDrop("existing", existingIndex, e)}
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
                      {galleryNewPreviews.map((url, index) => (
                        <div
                          key={`new-${index}`}
                          className="relative w-[100px] h-[100px] rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer"
                          draggable
                          onDragStart={(e) => handleGalleryItemDragStart("new", index, e)}
                          onDragOver={(e) => handleGalleryItemDragOver("new", index, e)}
                          onDrop={(e) => handleGalleryItemDrop("new", index, e)}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryNew(index)}
                            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white text-sm hover:bg-red-500"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <label
                        className={`w-[100px] h-[100px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-gray-500 transition-colors cursor-pointer bg-gray-50 ${
                          galleryDragActive
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-300 hover:border-orange-400"
                        }`}
                      >
                        <input
                          ref={galleryInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleGalleryChange}
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
                                .map((n) =>
                                  typeof n === "string" ? n.trim().toLowerCase() : ""
                                )
                                .filter(Boolean);
                              // ถ้าใช้ชื่อนี้อยู่แล้วในช่องไหนก็ตาม ไม่ต้องโชว์ใน suggestion
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

              {/* Delete Room */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={deleting}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
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
          <div className="px-6 pb-5  text-center">
            <p className="text-sm text-gray-700">Are you sure you want to delete this room?</p>
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
