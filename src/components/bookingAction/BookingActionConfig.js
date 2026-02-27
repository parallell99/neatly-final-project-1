/**
 * Config สำหรับแต่ละ action ใน booking-action
 * ใช้โดย BookingActionPage และ route /booking-action/[orderId]/[action]
 */
export const BOOKING_ACTIONS = {
  refund: {
    type: "refund",
    modalTitle: "Confirm Refund",
    modalDescription:
      "Are you sure you want to issue a refund for this booking? This action cannot be undone.",
    modalCancelLabel: "Cancel",
    modalConfirmLabel: "Yes, Issue Refund",
    successPath: (orderId) =>
      `/booking-action/${encodeURIComponent(orderId || "")}/success?action=refund`,
  },
  cancel: {
    type: "cancel",
    modalTitle: "Confirm Cancellation",
    modalDescription:
      "Are you sure you want to cancel this booking? This action cannot be undone.",
    modalCancelLabel: "Keep Booking",
    modalConfirmLabel: "Yes, Cancel Booking",
    successPath: (orderId) =>
      `/booking-action/${encodeURIComponent(orderId || "")}/success?action=cancel`,
  },
  "change-date": {
    type: "change-date",
    modalTitle: "Confirm Change Date",
    modalDescription:
      "Are you sure you want to change your check-in and check-out date?",
    modalCancelLabel: "No, I don't",
    modalConfirmLabel: "Yes, I want to change",
    successPath: (orderId) =>
      `/booking-action/${encodeURIComponent(orderId || "")}/success?action=change-date`,
  },
};

export const VALID_ACTIONS = Object.keys(BOOKING_ACTIONS);
