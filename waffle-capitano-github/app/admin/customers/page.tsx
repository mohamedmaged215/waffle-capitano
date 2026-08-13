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

type RedemptionCustomer = Pick<Customer, "id" | "name" | "phone_display" | "points_balance">;

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
  const [redemptionCustomer, setRedemptionCustomer] = useState<RedemptionCustomer | null>(null);
  const [pointsToUse, setPointsToUse] = useState("");
  const [redemptionError, setRedemptionError] = useState("");
  const [redeeming, setRedeeming] = useState(false);

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

  function openRedemption(customer: Customer) {
    setRedemptionCustomer(customer);
    setPointsToUse("");
    setRedemptionError("");
  }

  function closeRedemption() {
    if (redeeming) return;
    setRedemptionCustomer(null);
    setPointsToUse("");
    setRedemptionError("");
  }

  async function redeemPoints(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!redemptionCustomer) return;

    const requestedPoints = Number(pointsToUse);
    if (!Number.isInteger(requestedPoints) || requestedPoints <= 0) {
      setRedemptionError("اكتب عدد نقاط صحيح.");
      return;
    }
    if (requestedPoints > redemptionCustomer.points_balance) {
      setRedemptionError("رصيد العميل لا يكفي.");
      return;
    }

    setRedeeming(true);
    setRedemptionError("");
    const { data, error } = await supabase.rpc("dessert_redeem_points", {
      customer_id_input: redemptionCustomer.id,
      points_input: requestedPoints,
    });

    if (error) {
      setRedemptionError(error.message.includes("رصيد العميل") ? "رصيد العميل لا يكفي." : "تعذر استخدام النقاط. حاول مرة أخرى.");
      setRedeeming(false);
      return;
    }

    const result = data?.[0] as { points_used?: number; current_points?: number } | undefined;
    setRedeeming(false);
    setRedemptionCustomer(null);
    setPointsToUse("");
    setRedemptionError("");
    await loadCustomers();
    setMessage(`تم استخدام ${result?.points_used ?? requestedPoints} نقطة. الرصيد الحالي ${result?.current_points ?? 0} نقطة.`);
  }

  return (
    <main className="orders-page">
      <header className="admin-header">
        <div className="admin-brand"><Image src="/waffle-capitano-logo.jpeg" alt="" width={52} height={52} unoptimized /><div><small>وافل كابيتانو</small><h1>⭐ نقاط العملاء</h1></div></div>
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
                  <div className="customer-card-foot">
                    <span>آخر حركة: {formatDate(customer.updated_at)}</span>
                    <div className="customer-card-actions">
                      <button type="button" onClick={() => openRedemption(customer)} disabled={customer.points_balance <= 0}>استخدام نقاط</button>
                      <Link href="/admin/orders">العودة للطلبات</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {redemptionCustomer && (
        <div className="admin-modal-backdrop">
          <form className="store-modal redemption-modal" onSubmit={redeemPoints} role="dialog" aria-modal="true" aria-labelledby="redemption-title">
            <div className="modal-title">
              <div><small>⭐ نقاط العملاء</small><h2 id="redemption-title">استخدام نقاط</h2></div>
              <button type="button" onClick={closeRedemption} aria-label="إغلاق">×</button>
            </div>
            <p>اكتب عدد النقاط التي استخدمها العميل فقط. لا توجد قيمة مالية للنقطة الآن.</p>
            <div className="redemption-customer">
              <div><span>العميل</span><b>{redemptionCustomer.name}</b></div>
              <div><span>الهاتف</span><b dir="ltr">{redemptionCustomer.phone_display}</b></div>
              <div><span>الرصيد الحالي</span><b>{redemptionCustomer.points_balance} نقطة</b></div>
            </div>
            <label htmlFor="points-to-use">عدد النقاط المستخدمة
              <input id="points-to-use" value={pointsToUse} onChange={(event) => setPointsToUse(event.target.value)} type="number" inputMode="numeric" min="1" max={redemptionCustomer.points_balance} step="1" required placeholder="مثال: 2" />
            </label>
            {pointsToUse && Number(pointsToUse) > 0 && Number(pointsToUse) <= redemptionCustomer.points_balance ? (
              <div className="points-preview">الرصيد بعد الاستخدام: <b>{redemptionCustomer.points_balance - Number(pointsToUse)} نقطة</b></div>
            ) : null}
            {redemptionError && <p className="admin-error" role="alert">{redemptionError}</p>}
            <button className="admin-primary" type="submit" disabled={redeeming}>{redeeming ? "جاري الخصم..." : "تأكيد استخدام النقاط"}</button>
          </form>
        </div>
      )}
    </main>
  );
}
