"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadImage = async (file, folder = "profiles") => {
    if (!file) return null;

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      setUploading(false);
      return publicUrl;
    } catch (err) {
      setError(err?.message ?? "Upload failed");
      setUploading(false);
      return null;
    }
  };

  return { uploadImage, uploading, error };
}
