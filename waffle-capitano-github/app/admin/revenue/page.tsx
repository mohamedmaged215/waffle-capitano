"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SourceFilter = "all" | "website" | "store";
type PeriodFilter = "today" | "week" | "month" | "all";

type RevenueSummary = {
  total_revenue: number | string;
  order_count: number;
  average_order: number | string;
  website_revenue: number | string;
  store_revenue: number | string;
  website_count: number;
  store_count: number;
};

const sourceFilters: { id: SourceFilter; label: string }[] = [
  { id: "all", label: "كل الإيرادات" },
  { id: "website", label: "الويب سايت" },
  { id: "store", label: "المحل" },
];

const periodFilters: { id: PeriodFilter; label: string }[] = [
  { id: "today", label: "اليوم" },
  { id: "week", label: "آخر 7 أيام" },
  { id: "month", label: "هذا الشهر" },
  { id: "all", label: "كل المدة" },
];

const emptySummary: RevenueSummary = {
  total_revenue: 0,
  order_count: 0,
  average_order: 0,
  website_revenue: 0,
  store_revenue: 0,
  website_count: 0,
  store_count: 0,
};

function money(value: number | string) {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(Number(value) || 0);
}

export default function RevenuePage() {
  const router = useRouter();
  const [source, setSource] = useState<SourceFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("today");
  const [summary, setSummary] = useState<RevenueSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadRevenue = useCallback(async (selectedSource = source, selectedPeriod = period) => {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/admin/login");
      return;
    }

    const { data, error } = await supabase.rpc("dessert_revenue_summary", {
      source_filter_input: selectedSource,
      period_filter_input: selectedPeriod,
    });

    if (error) {
      setMessage("تعذر تحميل الإيرادات. اضغط تحديث وحاول مرة تانية.");
    } else {
      setSummary((data?.[0] as RevenueSummary | undefined) ?? emptySummary);
    }
    setLoading(false);
  }, [period, router, source]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadRevenue(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadRevenue]);

  function chooseSource(value: SourceFilter) {
    setSource(value);
  }

  function choosePeriod(value: PeriodFilter) {
    setPeriod(value);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  const selectedSourceLabel = sourceFilters.find((item) => item.id === source)?.label ?? "كل الإيرادات";

  return (
    <main className="orders-page">
      <header className="admin-header">
        <div className="admin-brand"><Image src="/waffle-capitano-logo.png" alt="" width={52} height={52} unoptimized /><div><small>وافل كابيتانو</small><h1>💰 الإيرادات</h1></div></div>
        <div className="header-actions">
          <button type="button" onClick={() => loadRevenue()}>تحديث</button>
          <button type="button" onClick={logout}>خروج</button>
        </div>
      </header>

      <section className="admin-content">
        <nav className="admin-module-nav" aria-label="أقسام لوحة الموظف">
          <Link href="/admin/orders">📦 الطلبات</Link>
          <Link href="/admin/customers">⭐ نقاط العملاء</Link>
          <Link className="active" href="/admin/revenue">💰 الإيرادات</Link>
        </nav>

        <div className="revenue-intro">
          <div><span>ملخص بسيط</span><h2>إيرادات الطلبات المسلّمة فقط</h2></div>
          <p>الطلبات الجديدة أو المحذوفة لا تدخل في الحساب.</p>
        </div>

        <div className="revenue-filter-panel">
          <fieldset>
            <legend>مصدر الإيراد</legend>
            <div className="revenue-filter-buttons">
              {sourceFilters.map((item) => <button type="button" className={source === item.id ? "active" : ""} aria-pressed={source === item.id} onClick={() => chooseSource(item.id)} key={item.id}>{item.label}</button>)}
            </div>
          </fieldset>
          <fieldset>
            <legend>الفترة</legend>
            <div className="revenue-filter-buttons period-buttons">
              {periodFilters.map((item) => <button type="button" className={period === item.id ? "active" : ""} aria-pressed={period === item.id} onClick={() => choosePeriod(item.id)} key={item.id}>{item.label}</button>)}
            </div>
          </fieldset>
        </div>

        {message && <div className="admin-message revenue-error" role="alert">{message}<button type="button" onClick={() => setMessage("")}>×</button></div>}

        {loading ? (
          <div className="revenue-loading" role="status">⏳ جاري حساب الإيرادات...</div>
        ) : (
          <div className="revenue-cards">
            <article className="revenue-card revenue-total">
              <span>{selectedSourceLabel}</span>
              <strong>{money(summary.total_revenue)} <small>جنيه</small></strong>
              <p>{summary.order_count} عملية مسلّمة</p>
            </article>
            <article className={`revenue-card website-card ${source === "store" ? "muted" : ""}`}>
              <span>🌐 الويب سايت</span>
              <strong>{money(summary.website_revenue)} <small>جنيه</small></strong>
              <p>{summary.website_count} طلب مسلّم</p>
            </article>
            <article className={`revenue-card store-card ${source === "website" ? "muted" : ""}`}>
              <span>🏪 المحل</span>
              <strong>{money(summary.store_revenue)} <small>جنيه</small></strong>
              <p>{summary.store_count} عملية مسلّمة</p>
            </article>
            <article className="revenue-card average-card">
              <span>متوسط العملية</span>
              <strong>{money(summary.average_order)} <small>جنيه</small></strong>
              <p>للمصدر المختار</p>
            </article>
          </div>
        )}
      </section>
    </main>
  );
}
