"use client";

import Navbar from "@/components/layout/navbar";
import BookingProgress from "@/components/booking/BookingProgress";
import BasicInformationForm from "@/components/booking/BasicInformationForm";
import BookingDetailCard from "@/components/booking/BookingDetailCard";

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      <Navbar />
      
      <div className="max-w-[1440px] mx-auto lg:px-[165px] py-6">
        {/* Page Title */}
        
        <h1 className="headline-3-booking-title text-[44px] text-green-800 mb-6 mx-4 lg:mt-20 lg:mx-0 lg:text-[68px]">Booking Room</h1>
        {/* Progress Indicator */}
        <BookingProgress currentStep={1} />
        
        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 mt-8">
          {/* Left Column - Basic Information Form */}
          <div className="bg-white rounded-lg px-4 py-6 lg:p-8">
            <BasicInformationForm />
          </div>
          
          {/* Right Column - Booking Detail Card */}
          <div className="hidden lg:block lg:sticky lg:top-8 h-fit">
            <BookingDetailCard />
          </div>
        </div>
      </div>
    </div>
  );
}
