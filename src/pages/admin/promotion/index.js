"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Pencil, XCircle, CheckCircle } from "lucide-react";
import SideBarAdmin from "@/components/layout/SideBarAdmin";
import PromotionFormModal from "@/components/admin/PromotionFormModal";
import PromotionCloseConfirmModal from "@/components/admin/PromotionCloseConfirmModal";

const PER_PAGE = 10;

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDiscount(p) {
  if (!p) return "—";
  const type = (p.discount_type || "percent").toLowerCase();
  const val = Number(p.discount_value) ?? 0;
  if (type === "fixed") return `${val.toLocaleString()} THB`;
  return `${val}%`;
}

export default function PromotionPage() {
  const [list, setList] = useState([]);
  const [usageStats, setUsageStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    discount_type: "percent",
    discount_value: "",
    min_spend: "",
    start_date: "",
    end_date: "",
    is_stackable: true,
    global_usage_limit: "",
    usage_limit_per_user: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [closeConfirm, setCloseConfirm] = useState(null);
  const [closing, setClosing] = useState(false);
  const [enableDisableAction, setEnableDisableAction] = useState(null);

  const loadPromotions = useCallback(() => {
    fetch("/api/admin/promotion/promotions")
      .then((res) => res.json())
      .then((json) => setList(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setList([]));
  }, []);

  const loadUsageStats = useCallback(() => {
    fetch("/api/admin/promotion/usages")
      .then((res) => res.json())
      .then((json) => setUsageStats(json?.data ?? {}))
      .catch(() => setUsageStats({}));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/admin/promotion/promotions").then((r) => r.json()),
      fetch("/api/admin/promotion/usages").then((r) => r.json()),
    ])
      .then(([promoRes, usageRes]) => {
        if (cancelled) return;
        setList(Array.isArray(promoRes?.data) ? promoRes.data : []);
        setUsageStats(usageRes?.data ?? {});
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [list, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (currentPage - 1) * PER_PAGE;
  const rows = useMemo(() => filtered.slice(startIdx, startIdx + PER_PAGE), [filtered, startIdx]);

  const openCreate = () => {
    setForm({
      name: "",
      code: "",
      description: "",
      discount_type: "percent",
      discount_value: "",
      min_spend: "",
      start_date: "",
      end_date: "",
      is_stackable: true,
      global_usage_limit: "",
      usage_limit_per_user: "",
    });
    setSaveError(null);
    setModal({ open: true, editing: null });
  };

  const openEdit = (p) => {
    setForm({
      name: p.name ?? "",
      code: p.code ?? "",
      description: p.description ?? "",
      discount_type: (p.discount_type || "percent").toLowerCase() === "fixed" ? "fixed" : "percent",
      discount_value: p.discount_value != null ? String(p.discount_value) : "",
      min_spend: p.min_spend != null ? String(p.min_spend) : "",
      start_date: p.start_date ? String(p.start_date).slice(0, 10) : "",
      end_date: p.end_date ? String(p.end_date).slice(0, 10) : "",
      is_stackable: !!p.is_stackable,
      global_usage_limit: p.global_usage_limit != null ? String(p.global_usage_limit) : "",
      usage_limit_per_user: p.usage_limit_per_user != null ? String(p.usage_limit_per_user) : "",
    });
    setSaveError(null);
    setModal({ open: true, editing: p });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code?.trim()) {
      setSaveError("Code is required");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const body = {
        name: form.name.trim() || form.code.trim().toUpperCase(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value) || 0,
        min_spend: form.min_spend ? Number(form.min_spend) : 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_stackable: form.is_stackable,
        global_usage_limit: form.global_usage_limit ? Number(form.global_usage_limit) : null,
        usage_limit_per_user: form.usage_limit_per_user ? Number(form.usage_limit_per_user) : null,
      };

      if (modal.editing) {
        const res = await fetch("/api/admin/promotion/promotions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: modal.editing.id, ...body }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to update");
      } else {
        const res = await fetch("/api/admin/promotion/promotions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to create");
      }
      closeModal();
      loadPromotions();
      loadUsageStats();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisablePromotion = async (p) => {
    setClosing(true);
    try {
      const res = await fetch("/api/admin/promotion/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, close: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to disable");
      setCloseConfirm(null);
      setEnableDisableAction(null);
      loadPromotions();
    } catch (err) {
      alert(err.message);
    } finally {
      setClosing(false);
    }
  };

  const handleEnablePromotion = async (p) => {
    setClosing(true);
    try {
      const res = await fetch("/api/admin/promotion/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, is_active: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to enable");
      setCloseConfirm(null);
      setEnableDisableAction(null);
      loadPromotions();
    } catch (err) {
      alert(err.message);
    } finally {
      setClosing(false);
    }
  };

  const isExpired = (p) => {
    if (!p?.end_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(p.end_date);
    end.setHours(23, 59, 59, 999);
    return today > end;
  };

  const isUnusable = (p) => {
    if (p?.is_active === false) return true;
    return isExpired(p);
  };

  return (
    <div className="flex">
      <SideBarAdmin />
      <div className="flex flex-col flex-1 bg-gray-100 min-h-screen">
        <div className="flex-1 pt-px pb-px pl-0 pr-0">
          <div className="bg-white rounded border border-gray-300 min-h-[600px] py-2.5 px-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 py-[25px] px-[7px]">
              <h1 className="font-serif text-2xl font-semibold text-gray-900">Promotions</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative w-full sm:w-64">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search code, name..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-12 pl-10 pr-4 py-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={openCreate}
                  className="w-[200px] inline-flex items-center gap-2 px-4 py-2 rounded bg-orange-600 text-white font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 h-12"
                >
                  <span className="text-lg leading-none">+</span>
                  Create Promotion
                </button>
              </div>
            </div>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            {/* Usage Stats */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Total Promotions</p>
                <p className="text-xl font-semibold text-gray-900">{list.length}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Active Promotions</p>
                <p className="text-xl font-semibold text-green-700">
                  {list.filter((p) => !isUnusable(p)).length}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Total Usages</p>
                <p className="text-xl font-semibold text-gray-900">
                  {Object.values(usageStats).reduce((a, b) => a + b, 0)}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-500">Loading...</div>
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="text-left text-gray-700 font-medium bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 border-b border-gray-200">Code</th>
                        <th className="px-4 py-3 border-b border-gray-200">Name</th>
                        <th className="px-4 py-3 border-b border-gray-200">Status</th>
                        <th className="px-4 py-3 border-b border-gray-200">Discount</th>
                        <th className="px-4 py-3 border-b border-gray-200">Min Spend</th>
                        <th className="px-4 py-3 border-b border-gray-200">Start</th>
                        <th className="px-4 py-3 border-b border-gray-200">End</th>
                        <th className="px-4 py-3 border-b border-gray-200">Used</th>
                        <th className="px-4 py-3 border-b border-gray-200">Per User Limit</th>
                        <th className="px-4 py-3 border-b border-gray-200">Global Limit</th>
                        <th className="px-4 py-3 border-b border-gray-200"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="p-8 text-center text-gray-500">
                            No promotions found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((p) => {
                          const expired = isUnusable(p);
                          return (
                          <tr
                            key={p.id}
                            className={`border-b border-gray-100 ${expired ? "bg-gray-100" : "hover:bg-gray-50"}`}
                          >
                            <td className={`px-4 py-3 ${expired ? "text-gray-400" : ""}`}>
                              <span className={`font-mono font-medium ${expired ? "text-gray-400" : "text-gray-900"}`}>
                                {p.code ?? "—"}
                              </span>
                              {expired && (
                                <span className="ml-2 text-xs text-gray-500 font-medium">
                                  {p.is_active === false ? "Disabled" : "Expired"}
                                </span>
                              )}
                            </td>
                            <td className={`px-4 py-3 ${expired ? "text-gray-400" : "text-gray-700"}`}>
                              {p.name ?? "—"}
                            </td>
                            <td className={`px-4 py-3 ${expired ? "text-gray-400" : "text-gray-700"}`}>
                              <span className={`inline-block px-2.5 py-1 rounded-full text-sm font-medium ${p.is_active === false ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}`}>
                                {p.is_active !== false ? "Enabled" : "Disabled"}
                              </span>
                            </td>
                            <td className={`px-4 py-3 ${expired ? "text-gray-400" : "text-gray-700"}`}>
                              {formatDiscount(p)}
                            </td>
                            <td className={`px-4 py-3 ${expired ? "text-gray-400" : "text-gray-700"}`}>
                              {p.min_spend ? `${Number(p.min_spend).toLocaleString()} THB` : "0"}
                            </td>
                            <td className={`px-4 py-3 ${expired ? "text-gray-400" : "text-gray-700"}`}>
                              {formatDate(p.start_date)}
                            </td>
                            <td className={`px-4 py-3 ${expired ? "text-gray-400" : "text-gray-700"}`}>
                              {formatDate(p.end_date)}
                            </td>
                            <td className={`px-4 py-3 font-medium ${expired ? "text-gray-400" : "text-gray-700"}`}>
                              {usageStats[p.id] ?? 0}
                            </td>
                            <td className={`px-4 py-3 ${expired ? "text-gray-400" : "text-gray-700"}`}>
                              {p.usage_limit_per_user != null ? String(p.usage_limit_per_user) : "—"}
                            </td>
                            <td className={`px-4 py-3 ${expired ? "text-gray-400" : "text-gray-700"}`}>
                              {p.global_usage_limit != null ? String(p.global_usage_limit) : "—"}
                            </td>
                            <td className={`px-4 py-3 ${expired ? "text-gray-400" : ""}`}>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEdit(p)}
                                  className={`p-2 rounded ${expired ? "text-gray-400 hover:text-gray-500 hover:bg-gray-200" : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"}`}
                                  title="Edit"
                                  aria-label="Edit promotion"
                                >
                                  <Pencil className="w-4 h-4" aria-hidden />
                                </button>
                                {p.is_active !== false ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCloseConfirm(p);
                                      setEnableDisableAction("disable");
                                    }}
                                    className="p-2 rounded text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    title="Disable"
                                    aria-label="Disable promotion"
                                  >
                                    <XCircle className="w-4 h-4" aria-hidden />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCloseConfirm(p);
                                      setEnableDisableAction("enable");
                                    }}
                                    className="p-2 rounded text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Enable"
                                    aria-label="Enable promotion"
                                  >
                                    <CheckCircle className="w-4 h-4" aria-hidden />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-center gap-1 mt-6">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`min-w-[36px] py-2 px-2 rounded border text-sm font-medium ${
                        p === currentPage
                          ? "bg-green-100 border-green-300 text-green-800"
                          : "border-gray-300 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    &gt;
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <PromotionFormModal
        open={modal.open}
        editing={modal.editing}
        form={form}
        setForm={setForm}
        saving={saving}
        saveError={saveError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <PromotionCloseConfirmModal
        open={!!closeConfirm}
        promotion={closeConfirm}
        action={enableDisableAction}
        loading={closing}
        onCancel={() => {
          setCloseConfirm(null);
          setEnableDisableAction(null);
        }}
        onConfirm={() => {
          if (enableDisableAction === "disable") handleDisablePromotion(closeConfirm);
          else if (enableDisableAction === "enable") handleEnablePromotion(closeConfirm);
        }}
      />
    </div>
  );
}
