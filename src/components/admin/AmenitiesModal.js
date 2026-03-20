"use client";

/**
 * Modal for managing amenities (edit/delete). Used by create-room and edit-room.
 * Pass all props from useAmenitiesModal().
 */
export default function AmenitiesModal({
  open,
  onClose,
  modalAmenitiesList,
  modalLoading,
  editAmenityTarget,
  editAmenityName,
  setEditAmenityName,
  editAmenitySaving,
  deleteAmenityTarget,
  deleteAmenitySaving,
  handleModalDeleteAmenity,
  handleModalDeleteAmenityCancel,
  handleModalDeleteAmenityConfirm,
  handleModalEditAmenity,
  handleModalEditAmenityCancel,
  handleModalEditAmenitySave,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">จัดการ Amenities</h3>
          <button
            type="button"
            onClick={onClose}
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
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            ปิด
          </button>
        </div>

        {editAmenityTarget && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Edit Amenity</h4>
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
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Delete Amenity</h4>
              <p className="text-sm text-gray-700 mb-4">
                Delete this amenity from the entire system (it will be removed from all rooms).
              </p>
              <p className="text-sm font-medium text-gray-900 mb-4">{deleteAmenityTarget.name}</p>
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
  );
}
