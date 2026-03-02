import Navbar from "@/components/layout/navbar";
import RoomsList from "@/components/room/RoomsList";
import Footer from "@/components/layout/footer";

export default function RoomsPage() {
  return (
    <div>
      <Navbar />
      <RoomsList />
      <Footer />
    </div>
  );
}