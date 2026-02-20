export const defaultMessage = [
  {
    type: "greeting_message",
    label: "Greeting message",
    required: true,
    message: "Welcome to Neatly Hotel! 🌟 I'm your virtual assistant. Choose a topic you'd like to know more about. I'm here to help! 😊"
  },
  {
    type: "auto_reply_message",
    label: "Auto-reply message",
    required: true,
    message: "Thanks for reaching out to us! If you need any more help, just give us a call at 029872345 we're happy to assist you! 😊"
  }
]

export const chatbotTopics = [
  {
    topic: "Room Types",
    replyFormat: "Room type",
    replyTitle: "Neatly Hotel offers a variety of room types to suit your needs! 🏨👉 Here are the options",
    roomTypes: ["Superior Garden View", "Deluxe", "Superior", "Supreme"],
    buttonName: "View Details"
  },
  {
    topic: "Booking",
    replyFormat: "Room type",
    replyTitle: "Let's get your booking started First, please choose the type of room you'd like 📖✨",
    roomTypes: ["Superior Garden View", "Deluxe", "Superior", "Supreme"],
    buttonName: "Book Now"
  },
  {
    topic: "Check-in & Check-out Time",
    replyFormat: "Message",
    replyMessage: "Great! 😊 Here are our check-in and check-out times:\nCheck-in time: From 2:00 PM onwards 🕐\nCheck-out time: By 12:00 PM 🕐"
  },
  {
    topic: "Payment methods",
    replyFormat: "Option with details",
    replyTitle: "Here are the payment methods we accept. Tap to see more details 💳🏧",
    options: [
      { option: "Credit Card", details: "We accept credit cards including Visa and MasterCard." },
      { option: "Cash", details: "You can pay at the hotel with cash or cheque. No payment is required until check-in." }
    ]
  },
  {
    topic: "Promotion",
    replyFormat: "Room type",
    replyTitle: "🎉 Our promotion this month  Get 10% off 🎊 when you book your stay within this month. Don't miss out!",
    roomTypes: ["Superior Garden View", "Deluxe", "Superior", "Supreme"],
    buttonName: "Book Now"
  }
]
