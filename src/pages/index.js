import { Geist, Geist_Mono } from "next/font/google";
import Button from "@/components/ui/buttons/buttons";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import HeroSlide from "@/components/layout/heroSlide";
import HeroRoomSuit from "@/components/layout/heroRoomSuit";
import HeroRoomService from "@/components/layout/heroRoomService";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans w-full`}
    >
      <Navbar />
      <HeroRoomService />
      <HeroRoomSuit />
      <HeroSlide />
      <Footer />
    </div>
  );
}
