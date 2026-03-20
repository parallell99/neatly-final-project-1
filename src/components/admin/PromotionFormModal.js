"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Button from "../ui/buttons/buttons";

function parseDateStr(str) {
  if (!str) return undefined;
  const d = new Date(str + "T12:00:00");
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default function PromotionFormModal({
  open,
  editing,
  form,
  setForm,
  saving,
  saveError,
  onClose,
  onSubmit,
}) {
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const startDate = parseDateStr(form.start_date);
  const endDate = parseDateStr(form.end_date);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 id="promo-modal-title" className="text-xl font-semibold text-gray-900">
            {editing ? "Edit Promotion" : "Create Promotion"}
          </h2>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
          <div>
            <label htmlFor="promo-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              id="promo-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. Summer Sale"
            />
          </div>
          <div>
            <label htmlFor="promo-code" className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
            <input
              id="promo-code"
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
              placeholder="SUMMER20"
              disabled={!!editing}
            />
            {editing && <p className="text-xs text-gray-500 mt-0.5">Code cannot be changed when editing</p>}
          </div>
          <div>
            <label htmlFor="promo-desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="promo-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. 20% off during summer"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="promo-disc-type" className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                id="promo-disc-type"
                value={form.discount_type}
                onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (THB)</option>
              </select>
            </div>
            <div>
              <label htmlFor="promo-disc-value" className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <input
                id="promo-disc-value"
                type="number"
                min={0}
                step={form.discount_type === "percent" ? 1 : 0.01}
                value={form.discount_value}
                onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={form.discount_type === "percent" ? "20" : "500"}
              />
            </div>
          </div>
          <div>
            <label htmlFor="promo-max-discount" className="block text-sm font-medium text-gray-700 mb-1">Max Discount (THB)</label>
            <input
              id="promo-max-discount"
              type="number"
              min={0}
              step={0.01}
              value={form.max_discount ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, max_discount: e.target.value }))}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-0.5">Optional. Leave blank for no cap.</p>
          </div>
          <div>
            <label htmlFor="promo-min-spend" className="block text-sm font-medium text-gray-700 mb-1">Min Spend (THB)</label>
            <input
              id="promo-min-spend"
              type="number"
              min={0}
              value={form.min_spend}
              onChange={(e) => setForm((f) => ({ ...f, min_spend: e.target.value }))}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="promo-start" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Popover open={openStart} onOpenChange={setOpenStart}>
                <PopoverTrigger asChild>
                  <button
                    id="promo-start"
                    type="button"
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 text-left text-sm flex items-center justify-between hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <span className={startDate ? "text-gray-900" : "text-gray-500"}>
                      {startDate ? format(startDate, "EEE, dd MMM yyyy") : "Select date"}
                    </span>
                    <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setForm((f) => ({ ...f, start_date: date ? format(date, "yyyy-MM-dd") : "" }));
                      setOpenStart(false);
                    }}
                    initialFocus
                    className="p-6"
                    classNames={{
                      day_selected: "bg-green-600 text-white hover:bg-green-600",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label htmlFor="promo-end" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Popover open={openEnd} onOpenChange={setOpenEnd}>
                <PopoverTrigger asChild>
                  <button
                    id="promo-end"
                    type="button"
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 text-left text-sm flex items-center justify-between hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <span className={endDate ? "text-gray-900" : "text-gray-500"}>
                      {endDate ? format(endDate, "EEE, dd MMM yyyy") : "Select date"}
                    </span>
                    <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    disabled={startDate ? { before: startDate } : undefined}
                    onSelect={(date) => {
                      setForm((f) => ({ ...f, end_date: date ? format(date, "yyyy-MM-dd") : "" }));
                      setOpenEnd(false);
                    }}
                    initialFocus
                    className="p-6"
                    classNames={{
                      day_selected: "bg-green-600 text-white hover:bg-green-600",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="promo-global-limit" className="block text-sm font-medium text-gray-700 mb-1">Global Usage Limit</label>
              <input
                id="promo-global-limit"
                type="number"
                min={0}
                value={form.global_usage_limit}
                onChange={(e) => setForm((f) => ({ ...f, global_usage_limit: e.target.value }))}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label htmlFor="promo-per-user" className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
              <input
                id="promo-per-user"
                type="number"
                min={0}
                value={form.usage_limit_per_user}
                onChange={(e) => setForm((f) => ({ ...f, usage_limit_per_user: e.target.value }))}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Unlimited"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="promo-stackable"
              type="checkbox"
              checked={form.is_stackable}
              onChange={(e) => setForm((f) => ({ ...f, is_stackable: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 hover:cursor-pointer"
            />
            <label htmlFor="promo-stackable" className="text-sm text-gray-700">Stackable with other promotions</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 hover:cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              buttonStyle="primary"
              disabled={saving}
              buttonText={saving ? "Saving..." : (editing ? "Update" : "Create")}
              className="px-4 py-2 rounded text-white font-medium disabled:opacity-50 hover:cursor-pointer"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
