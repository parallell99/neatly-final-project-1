"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PromotionCard from "@/components/promotion/PromotionCard";
import { Toaster } from "@/components/ui/sonner";

export default function SpecialOffersPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/promotions/list")
      .then((res) => res.json())
      .then((json) => {
        const data = json?.data;
        setPromotions(Array.isArray(data) ? data : []);
        if (json?.message && !data) setError(json.message);
      })
      .catch((err) => {
        setError(err.message || "Failed to load offers");
        setPromotions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 w-full">
      <Navbar />
      <Toaster position="top-center" richColors closeButton />

      <main className="flex-1 w-full px-4 py-8 lg:px-8 lg:py-12">
        <div className="max-w-[1440px] mx-auto">
          {/* Section header */}
          <header className="mb-8 lg:mb-12">
            <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
              Special Offers
            </h1>
            <p className="mt-2 text-gray-600 text-base lg:text-lg">
              Save on your stay with our current promotions. Copy the code and apply at checkout.
            </p>
          </header>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white border border-gray-100 p-5 shadow-md animate-pulse"
                  aria-hidden
                >
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-5 bg-gray-100 rounded w-1/2 mb-4" />
                  <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-4" />
                  <div className="h-10 bg-gray-200 rounded-lg w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800">
              <p>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && promotions.length === 0 && (
            <div className="rounded-xl bg-white border border-gray-100 p-8 shadow-sm text-center text-gray-500">
              <p>No special offers at the moment. Check back later.</p>
            </div>
          )}

          {/* Promotion grid: 1 col mobile, 2 sm, 3 lg, 4 xl */}
          {!loading && !error && promotions.length > 0 && (
            <section
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
              aria-label="Promotion cards"
            >
              {promotions.map((promo) => (
                <PromotionCard key={promo.id} promotion={promo} />
              ))}
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
