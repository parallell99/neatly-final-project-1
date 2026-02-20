import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import HeroSlide from "@/components/layout/heroSlide";
import HeroRoomSuit from "@/components/layout/heroRoomSuit";
import HeroRoomService from "@/components/layout/heroRoomService";
import { useAuth } from "@/contexts/authentication";

import HeroSearch from "@/components/layout/herosearch";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const { isAuthenticated, user, userRole, getUserLoading } = useAuth();
 console.log(user)
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans w-full`}
    >
      <Navbar />
      {getUserLoading ? (
        <p className="text-gray-500 text-sm">กำลังโหลด...</p>
      ) : (
        <section
          className="w-full max-w-[1440px] mx-auto px-4 py-2 text-center"
          aria-label="Auth status"
        >
          <p className="text-gray-700">
            isAuthenticated: <strong>{isAuthenticated ? "true" : "false"}</strong>
            {user && (
              <>
                {" · "}
                user: {user.username ?? user.first_name} · role: {userRole ?? "—"}
              </>
            )}
          </p>
        </section>
      )}
      <HeroSearch />
      <HeroRoomService />
      <HeroRoomSuit />
      <HeroSlide />
      <Footer />
    </div>
  );
}
