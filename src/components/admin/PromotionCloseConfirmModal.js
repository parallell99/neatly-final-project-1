"use client";

export default function PromotionEnableDisableModal({
  open,
  promotion,
  action,
  loading,
  onCancel,
  onConfirm,
}) {
  if (!open || !promotion || !action) return null;

  const isDisable = action === "disable";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enable-disable-confirm-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 id="enable-disable-confirm-title" className="text-lg font-semibold text-gray-900 mb-2">
          {isDisable ? "Disable Promotion" : "Enable Promotion"}
        </h2>
        <p className="text-gray-600 mb-6">
          {isDisable
            ? `Disable promotion "${promotion.code}"? It will no longer be usable until you enable it again.`
            : `Enable promotion "${promotion.code}"? It will be usable again.`}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded font-medium disabled:opacity-50 ${
              isDisable
                ? "bg-orange-600 text-white hover:bg-orange-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {loading ? (isDisable ? "Disabling..." : "Enabling...") : isDisable ? "Disable" : "Enable"}
          </button>
        </div>
      </div>
    </div>
  );
}
