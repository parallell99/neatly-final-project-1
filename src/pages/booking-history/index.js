import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"
import BookingHistory from "@/components/booking-history/history"
import Chatbot from "@/components/layout/chatbot/ChatbotButton"

export default function BookingHistoryPage() {
    return (
        <>
            <Chatbot />
            <Navbar />
            <BookingHistory />
            <Footer />
        </>
    )
}