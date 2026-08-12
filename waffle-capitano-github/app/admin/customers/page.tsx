"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type CustomerOrder = {
  id: number;
  customer_name: string;
  total: number;
  status: "new" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  source: "whatsapp" | "store";
  created_at: string;
};

type Customer = {
  id: number;
  name: string;
  phone_display: string;
  points_balance: number;
  updated_at: string;
  dessert_orders: CustomerOrder[];
};

function comparablePhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("20")) digits = `0${digits.slice(2)}`;
  return digits;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/admin/login");
      return;
    }

    const { data, error } = await supabase
      .from("dessert_customers")
      .select("id,name,phone_display,points_balance,updated_at,dessert_orders(id,customer_name,total,status,source,created_at)")
      .order("updated_at", { ascending: false })
      .limit(500);

    if (error) setMessage("تعذر تحميل العملاء. اضغط تحديث.");
    else setCustomers((data ?? []) as unknown as Customer[]);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadCustomers(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadCustomers]);

  const visibleCustomers = useMemo(() => {
    const query = comparablePhone(search);
    if (!query) return customers;
    return customers.filter((customer) => comparablePhone(customer.phone_display).includes(query));
  }, [customers, search]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <main className="orders-page">
      <header className="admin-header">
        <div className="admin-brand"><Image src="/waffle-capitano-logo.jpeg" alt="" width={52} height={52} /><div><small>وافل كابيتانو</small><h1>⭐ نقاط العملاء</h1></div></div>
        <div className="header-actions">
          <button type="button" onClick={loadCustomers}>تحديث</button>
          <button type="button" onClick={logout}>خروج</button>
        </div>
      </header>

      <section className="admin-content">
        <nav className="admin-module-nav" aria-label="أقسام لوحة الموظف">
          <Link href="/admin/orders">📦 الطلبات</Link>
          <Link className="active" href="/admin/customers">⭐ نقاط العملاء</Link>
          <Link href="/admin/revenue">💰 الإيرادات</Link>
        </nav>

        <div className="phone-identity-note"><span>📱</span><div><b>رقم الهاتف هو حساب العميل</b><p>حتى لو العميل استخدم أسماء مختلفة، كل مشترياته ونقاطه تفضل على نفس الرقم.</p></div></div>

        <div className="customers-tools">
          <label className="admin-search"><span>🔎</span><input value={search} onChange={(event) => setSearch(event.target.value)} inputMode="tel" dir="ltr" placeholder="ابحث برقم الهاتف" aria-label="بحث عن عميل برقم الهاتف" /></label>
          <span>{visibleCustomers.length} عميل</span>
        </div>

        {message && <div className="admin-message" role="status">{message}<button type="button" onClick={() => setMessage("")}>×</button></div>}

        {loading ? (
          <div className="admin-empty"><span>⏳</span><p>جاري تحميل العملاء...</p></div>
        ) : visibleCustomers.length === 0 ? (
          <div className="admin-empty"><span>👤</span><h2>العميل مش موجود</h2><p>راجع رقم الهاتف واكتبه كاملًا.</p></div>
        ) : (
          <div className="customers-grid">
            {visibleCustomers.map((customer) => {
              const orders = customer.dessert_orders ?? [];
              const names = Array.from(new Set([customer.name, ...orders.map((order) => order.customer_name)].filter(Boolean)));
              const deliveredOrders = orders.filter((order) => order.status === "delivered");
              const totalSpent = deliveredOrders.reduce((sum, order) => sum + Number(order.total), 0);
              return (
                <article className="customer-card" key={customer.id}>
                  <div className="customer-card-head"><div><small>رقم حساب العميل</small><a href={`tel:${customer.phone_display}`} dir="ltr">{customer.phone_display}</a></div><div className="customer-points"><strong>{customer.points_balance}</strong><span>نقطة</span></div></div>
                  <div className="customer-stats"><p><span>عدد العمليات</span><b>{orders.length}</b></p><p><span>تم تسليمها</span><b>{deliveredOrders.length}</b></p><p><span>إجمالي المستلم</span><b>{totalSpent} جنيه</b></p></div>
                  <div className="customer-names"><span>الأسماء المستخدمة</span><p>{names.join("، ")}</p></div>
                  <div className="customer-card-foot"><span>آخر حركة: {formatDate(customer.updated_at)}</span><Link href="/admin/orders">العودة للطلبات</Link></div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
