"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  className,
}) {
  const descriptionId = React.useId();

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn("rounded-lg border border-gray-200 bg-white p-0 shadow-lg sm:max-w-md", className)}
        aria-describedby={descriptionId}
      >
        <div className="flex flex-col">
          {/* Header: title + close */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <DialogTitle className="m-0 font-sans text-lg font-bold text-gray-800">
              {title}
            </DialogTitle>
            <DialogClose
              className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 hover:cursor-pointer focus:outline-none focus:ring-offset-2"
              aria-label="ปิด"
            >
              <XIcon className="size-5" aria-hidden />
            </DialogClose>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <DialogDescription
              id={descriptionId}
              className="font-sans text-sm text-gray-600"
            >
              {description}
            </DialogDescription>
          </div>

          {/* Footer: Cancel + Confirm */}
          <div className="flex justify-end gap-3 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-orange-600 font-sans text-orange-600 hover:bg-orange-100 hover:text-orange-700 hover:cursor-pointer"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="bg-orange-600 font-sans text-white hover:bg-orange-500 hover:cursor-pointer"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmModal };
