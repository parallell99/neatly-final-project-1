import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

// Dynamically import RoomDetail to avoid SSR issues with image imports
const RoomDetail = dynamic(
  () => import("@/components/layout/RoomDetail/RoomDetail"),
  { 
    ssr: false,
    loading: () => null
  }
);

export default function RoomDetailPage() {
  const router = useRouter();
  const { slug } = router.query;

  // Valid room IDs
  const validRoomIds = [
    "superior-garden-view",
    "deluxe",
    "superior",
    "premier-sea-view",
    "supreme",
    "suite"
  ];

  const isValidRoom = slug && validRoomIds.includes(slug);

  if (!isValidRoom) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <h1 className="headline-3 text-gray-900 mb-4">Room Not Found</h1>
            <p className="body-1 text-gray-600 mb-8">
              The room you're looking for doesn't exist.
            </p>
            <button
              onClick={() => router.push("/")}
              className="btn btn-primary"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      {slug && <RoomDetail roomId={slug} />}
      <Footer />
    </div>
  );
}

// Force server-side rendering to prevent prerendering issues
export async function getServerSideProps() {
  return {
    props: {},
  };
}
