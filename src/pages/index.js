import { Geist, Geist_Mono } from "next/font/google";
import Button from "@/components/ui/buttons/buttons";
import Navbar from "@/components/layout/navbar";
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
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="headline-1">Hello World1</h1>
        </div>
        <div>
          <h1 className="headline-2">Hello World2</h1>
        </div>
        <div>
          <h1 className="headline-3">Hello World3</h1>
        </div>
        <div>
          <h1 className="headline-4">Hello World4</h1>
        </div>
        <div>
          <h1 className="headline-5">Hello World5</h1>
        </div>
        <div>
          <h1 className="body-1">Hello World6</h1>
        </div>
        <div>
          <h1 className="body-2">Hello World7</h1>
        </div>
        <div>
          <h1 className="body-3">Hello World8</h1>
        </div>
        <div className="">
          <Button
            buttonText="register"
            buttonStyle="primary"
            style={{ width: "200px" }}
          />
        </div>
        <div className="">
          <Button buttonText="Book Now" buttonStyle="primary" />
        </div>

        <div>
          <Button buttonText="Book Now" buttonStyle="secondary" />
        </div>
        <div>
          <Button buttonText="Ghost ->" buttonStyle="ghost" />
        </div>

        <div className="status-vacant p-4 rounded ">
          <span className="body-2 ">vacant status sample box.</span>
        </div>
        <div className="status-occupied p-4 rounded ">
          <span className="body-2 ">occupied status sample box.</span>
        </div>
        <div className="status-assign-clean p-4 rounded ">
          <span className="body-2 ">assign clean status sample box.</span>
        </div>
        <div className="status-assign-dirty p-4 rounded ">
          <span className="body-2 ">assign dirty status sample box.</span>
        </div>
        <div className="status-vacant-clean p-4 rounded ">
          <span className="body-2 ">vacant clean status sample box.</span>
        </div>
        <div className="status-vacant-clean-inspected p-4 rounded ">
          <span className="body-2 ">vacant clean inspected status sample box.</span>
        </div>
        <div className="status-vacant-clean-pick-up p-4 rounded ">
          <span className="body-2 ">vacant clean pick up status sample box.</span>
        </div>
        <div className="status-occupied-clean p-4 rounded ">
          <span className="body-2 ">occupied clean status sample box.</span>
        </div>
        <div className="status-occupied-clean-inspected p-4 rounded ">
          <span className="body-2 ">occupied clean inspected status sample box.</span>
        </div>
        <div className="status-occupied-dirty p-4 rounded ">
          <span className="body-2 ">occupied dirty status sample box.</span>
        </div>
        <div className="status-out-of-order p-4 rounded ">
          <span className="body-2 ">out of order status sample box.</span>
        </div>
        <div className="status-out-of-service p-4 rounded ">
          <span className="body-2 ">out of service status sample box.</span>
        </div>
        <div className="status-out-of-inventory p-4 rounded ">
          <span className="body-2 ">out of inventory status sample box.</span>
        </div>
      </div>

      
    </div>
  );
}
