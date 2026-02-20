"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SearchSection() {

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

      {/* Check In */}
      <div>
        <p className="body-2 mb-2">Check In</p>
        <Input type="date" />
      </div>

      {/* Check Out */}
      <div>
        <p className="body-2 mb-2">Check Out</p>
        <Input type="date" />
      </div>

      {/* Rooms & Guests */}
      <div>
        <p className="body-2 mb-2">Rooms & Guests</p>
        <Select>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="1 room, 2 guests" />
          </SelectTrigger>
          <SelectContent className="w-full" position="popper">
            <SelectItem value="1">1 room, 2 guests</SelectItem>
            <SelectItem value="2">2 rooms, 4 guests</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search Button */}
      <button className="btn btn-secondary w-full md:w-auto">
        Search
      </button>

    </div>
  );
}
