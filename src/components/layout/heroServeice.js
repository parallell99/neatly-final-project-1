"use client";

import SpaIcon from "@/assets/icons/bx_spa.svg?url";
import WifiIcon from "@/assets/icons/ant-design_wifi-outlined.svg?url";
import SaunaIcon from "@/assets/icons/ep_hot-water.svg?url";
import CarIcon from "@/assets/icons/carbon_car.svg?url";
import SofaIcon from "@/assets/icons/iconoir_two-seater-sofa.svg?url";
import PhoneIcon from "@/assets/icons/bx_phone-call.svg?url";
import DumpbelIcon from "@/assets/icons/dumpbel.svg?url";

const services = [
  { icon: SpaIcon, label: "Spa" },
  { icon: SaunaIcon, label: "Sauna" },
  { icon: DumpbelIcon, label: "Fitness" },
  { icon: SofaIcon, label: "Arrival Lounge" },
  { icon: WifiIcon, label: "Free Wifi" },
  { icon: CarIcon, label: "Parking" },
  { icon: PhoneIcon, label: "24 hours operation" },
];

export default function HeroServeice() {
  return (
    <div id="service" className="w-full">
      {/* Service & Facilities Section */}
      <div className="bg-green-700 py-12 lg:py-16 px-6 lg:px-12 lg:h-[500px] mb-10">
        <h3 className="font-serif headline-3 text-white text-center mb-10 mt-17">
          Service & Facilities
        </h3>

        <div className="flex flex-wrap justify-center gap-8 lg:flex-nowrap lg:justify-between lg:items-center lg:max-w-[1200px] lg:mx-auto">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            const isLastItem = index === services.length - 1;
            const isOddCount = services.length % 2 !== 0;
            const shouldCenter = isLastItem && isOddCount;
            
            return (
              <div
                key={index}
                className={`flex flex-col items-center gap-8 text-center ${
                  shouldCenter
                    ? "w-full md:w-auto lg:w-auto"
                    : "w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] lg:w-auto"
                }`}
              >
                <div className="w-15 h-12 flex items-center justify-center text-white">
                  <img src={IconComponent} className="w-12 h-12 brightness-0 invert" alt="" aria-hidden />
                </div>
                <span className="body-1 text-white">
                  {service.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
