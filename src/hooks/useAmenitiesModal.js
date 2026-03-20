"use client";

import { useState, useCallback } from "react";

/**
 * Shared hook for the "จัดการ Amenities" modal (create-room, edit-room).
 * @param {() => void | Promise<void>} refetchList - Called when modal closes to refresh parent's amenities list
 */
export function useAmenitiesModal(refetchList) {
  const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);
  const [modalAmenitiesList, setModalAmenitiesList] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [editAmenityTarget, setEditAmenityTarget] = useState(null);
  const [editAmenityName, setEditAmenityName] = useState("");
  const [editAmenitySaving, setEditAmenitySaving] = useState(false);
  const [deleteAmenityTarget, setDeleteAmenityTarget] = useState(null);
  const [deleteAmenitySaving, setDeleteAmenitySaving] = useState(false);

  const fetchModalAmenities = useCallback(() => {
    setModalLoading(true);
    fetch("/api/admin/amenities-list")
      .then((res) => res.json())
      .then((json) => {
        setModalAmenitiesList(Array.isArray(json?.data) ? json.data : []);
      })
      .catch(() => setModalAmenitiesList([]))
      .finally(() => setModalLoading(false));
  }, []);

  const openAmenitiesModal = useCallback(() => {
    setAmenitiesModalOpen(true);
    fetchModalAmenities();
  }, [fetchModalAmenities]);

  const closeAmenitiesModal = useCallback(() => {
    setAmenitiesModalOpen(false);
    if (typeof refetchList === "function") {
      fetch("/api/admin/amenities-list")
        .then((res) => res.json())
        .then((json) => {
          refetchList(Array.isArray(json?.data) ? json.data : []);
        })
        .catch(() => {});
    }
  }, [refetchList]);

  const handleModalDeleteAmenity = useCallback((amenity) => {
    setDeleteAmenityTarget(amenity);
  }, []);

  const handleModalDeleteAmenityCancel = useCallback(() => {
    if (deleteAmenitySaving) return;
    setDeleteAmenityTarget(null);
  }, [deleteAmenitySaving]);

  const handleModalDeleteAmenityConfirm = useCallback(async () => {
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
  }, [deleteAmenityTarget, fetchModalAmenities]);

  const handleModalEditAmenity = useCallback((amenity) => {
    setEditAmenityTarget(amenity);
    setEditAmenityName(amenity?.name ?? "");
  }, []);

  const handleModalEditAmenityCancel = useCallback(() => {
    if (editAmenitySaving) return;
    setEditAmenityTarget(null);
    setEditAmenityName("");
  }, [editAmenitySaving]);

  const handleModalEditAmenitySave = useCallback(async () => {
    if (!editAmenityTarget) return;
    const trimmed = editAmenityName.trim();
    const current = editAmenityTarget.name ?? "";
    if (!trimmed || trimmed === current) {
      setEditAmenityTarget(null);
      setEditAmenityName("");
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
  }, [editAmenityTarget, editAmenityName, fetchModalAmenities]);

  return {
    amenitiesModalOpen,
    modalAmenitiesList,
    modalLoading,
    editAmenityTarget,
    editAmenityName,
    setEditAmenityName,
    editAmenitySaving,
    deleteAmenityTarget,
    deleteAmenitySaving,
    openAmenitiesModal,
    closeAmenitiesModal,
    handleModalDeleteAmenity,
    handleModalDeleteAmenityCancel,
    handleModalDeleteAmenityConfirm,
    handleModalEditAmenity,
    handleModalEditAmenityCancel,
    handleModalEditAmenitySave,
  };
}
