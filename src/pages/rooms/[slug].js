import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

// Dynamically import RoomDetail to avoid SSR issues with image imports
const RoomDetail = dynamic(
  () => import("@/components/layout/RoomDetail/RoomDetail"),
  { 
    ssr: false,
    loading: () => <div>Loading...</div>
  }
);

export default function RoomDetailPage() {
  const router = useRouter();
  const { slug } = router.query;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      {slug ? <RoomDetail roomId={slug} /> : <div className="flex-1 flex items-center justify-center py-20"><p className="text-gray-600">Loading...</p></div>}
      <Footer />
    </div>
  );
}

// Prevent static generation/prerendering - render on each request
export async function getServerSideProps() {
  return {
    props: {},
  };
}
