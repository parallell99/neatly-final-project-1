"use client";

import { useState, useRef, useCallback } from "react";
import { MAX_IMAGE_SIZE } from "@/lib/room-form-constants";

/**
 * Shared hook for main room image upload (create-room, edit-room).
 * @param {object} options
 * @param {string} [options.initialUrl] - Existing image URL (edit mode)
 * @param {(url: string | null) => void} [options.setInitialUrl] - Called when image is removed (edit mode)
 */
export function useMainImage({ initialUrl = null, setInitialUrl } = {}) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const displayUrl = preview || initialUrl || null;

  const handleChange = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    if (f.size > MAX_IMAGE_SIZE) {
      alert("Please upload an image smaller than 5MB.");
      return;
    }
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setFile(f);
  }, [preview]);

  const handleRemove = useCallback((e) => {
    e?.preventDefault?.();
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    if (typeof setInitialUrl === "function") setInitialUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [preview, setInitialUrl]);

  return {
    displayUrl,
    preview,
    setPreview,
    file,
    setFile,
    inputRef,
    handleChange,
    handleRemove,
  };
}
