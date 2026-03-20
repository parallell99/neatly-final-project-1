"use client";

import { useState, useRef, useCallback } from "react";
import { MAX_IMAGE_SIZE } from "@/lib/room-form-constants";

/**
 * Shared hook for gallery "new" images only (create-room; edit-room uses for new uploads).
 * Handles file list, previews, drag-and-drop upload, and drag-to-reorder.
 */
export function useGalleryNewFiles() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [dragItem, setDragItem] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const inputRef = useRef(null);

  const handleChange = useCallback((e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    const valid = [];
    const urls = [];
    list.forEach((file) => {
      if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE) return;
      valid.push(file);
      urls.push(URL.createObjectURL(file));
    });
    if (valid.length) {
      setFiles((prev) => [...prev, ...valid]);
      setPreviews((prev) => [...prev, ...urls]);
    }
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dt = e.dataTransfer;
    if (!dt?.files?.length) return;
    handleChange({ target: { files: dt.files } });
  }, [handleChange]);

  const removeAt = useCallback((index) => {
    setPreviews((prev) => {
      const u = prev[index];
      if (typeof u === "string" && u.startsWith("blob:")) URL.revokeObjectURL(u);
      return prev.filter((_, i) => i !== index);
    });
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleItemDragStart = useCallback((index, e) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    }
    setDragItem({ index });
    setDropTargetIndex(index);
  }, []);

  const handleItemDragOver = useCallback((index, e) => {
    if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    if (dragItem == null) return;
    setDropTargetIndex(index);
  }, [dragItem]);

  const handleItemDrop = useCallback((toIndex, e) => {
    if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    const from = dragItem?.index;
    if (from == null || from === toIndex) {
      setDragItem(null);
      setDropTargetIndex(null);
      return;
    }
    setFiles((prev) => {
      const arr = [...prev];
      if (from < 0 || from >= arr.length || toIndex < 0 || toIndex >= arr.length) return prev;
      const [moved] = arr.splice(from, 1);
      arr.splice(toIndex, 0, moved);
      return arr;
    });
    setPreviews((prev) => {
      const arr = [...prev];
      if (from < 0 || from >= arr.length || toIndex < 0 || toIndex >= arr.length) return prev;
      const [moved] = arr.splice(from, 1);
      arr.splice(toIndex, 0, moved);
      return arr;
    });
    setDragItem(null);
    setDropTargetIndex(null);
  }, [dragItem]);

  const handleItemDragEnd = useCallback(() => {
    setDragItem(null);
    setDropTargetIndex(null);
  }, []);

  return {
    files,
    previews,
    dragActive,
    dragItem,
    dropTargetIndex,
    setDragItem,
    inputRef,
    handleChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeAt,
    handleItemDragStart,
    handleItemDragOver,
    handleItemDrop,
    handleItemDragEnd,
  };
}
