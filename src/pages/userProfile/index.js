import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import UserProfile from "@/components/layout/userProfile";

export default function UserProfilePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1 pt-6 pb-12 lg:bg-[#F7F7FB]">
        <UserProfile />
      </main>
      <Footer />
    </div>
  );
}
