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

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans w-full`}
    >
      <Navbar />
      
      <HeroSearch />
      <HeroRoomService />
      <HeroRoomSuit />
      <HeroSlide />
      <Footer />
    </div>
  );
}
