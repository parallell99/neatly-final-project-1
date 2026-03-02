import Navbar from "@/components/layout/navbar";
import RoomsList from "@/components/room/RoomsList";
import Footer from "@/components/layout/footer";
import Chatbot from "@/components/layout/chatbot/ChatbotButton"

export default function RoomsPage() {
  return (
    <div>
      <Chatbot />
      <Navbar />
      <RoomsList />
      <Footer />
    </div>
  );
}