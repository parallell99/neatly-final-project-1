"use client";

export default function BookingProgress({ currentStep = 1 }) {
  const steps = [
    { number: 1, label: "Basic Information" },
    { number: 2, label: "Special Request" },
    { number: 3, label: "Payment Method" },
  ];

  return (
    <div className="w-full flex flex-col gap-4 mb-6 mx-4 lg:flex-row lg:gap-15 lg:py-10 lg:m-0 lg:border-b lg:border-gray-300">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center gap-3">
          {/* Step Badge */}
          <div
            className={`w-[66px] h-[50px] rounded-lg flex items-center justify-center font-sans headline-4 font-semibold transition-colors lg:w-[66px] lg:h-[66px] ${step.number === currentStep
                ? "bg-[#E76B39] text-white"
                : "bg-[#E4E6ED] text-gray-600"
              } ${step.number < currentStep ? "bg-orange-100 text-orange-500" : "bg-[#E4E6ED] text-gray-600"}`}
          >
            {step.number}
          </div>

          {/* Step Label */}
          <span
            className={`font-sans text-base headline-5 transition-colors ${step.number === currentStep
                ? "text-orange-500"
                : "text-gray-600"}
            ${step.number < currentStep 
              ? "text-gray-900" 
              : "text-gray-600"}`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
