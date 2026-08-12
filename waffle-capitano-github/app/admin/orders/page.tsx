"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";

type OrderItem = {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
};

type Order = {
  id: number;
  customer_id: number;
  customer_name: string;
  phone_display: string;
  address: string;
  source: "whatsapp" | "store";
  status: OrderStatus;
  total: number;
  points_awarded: number;
  created_at: string;
  dessert_order_items: OrderItem[];
  dessert_customers: { points_balance: number } | null;
};

type Filter = "all" | "new" | "preparing" | "ready" | "delivered" | "cancelled";

const statusText: Record<OrderStatus, string> = {
  new: "طلب جديد",
  confirmed: "تم تأكيد الطلب",
  preparing: "قيد التحضير",
  ready: "الطلب جاهز",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const filters: { id: Filter; label: string; icon: string }[] = [
  { id: "all", label: "كل الطلبات", icon: "📦" },
  { id: "new", label: "طلبات جديدة", icon: "🔔" },
  { id: "preparing", label: "قيد التحضير", icon: "🟡" },
  { id: "ready", label: "جاهزة", icon: "🟢" },
  { id: "delivered", label: "تم التسليم", icon: "✅" },
  { id: "cancelled", label: "ملغاة", icon: "❌" },
];

const nextAction: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
  new: { label: "تأكيد الطلب", status: "confirmed" },
  confirmed: { label: "بدء التحضير", status: "preparing" },
  preparing: { label: "الطلب جاهز", status: "ready" },
  ready: { label: "تم التسليم", status: "delivered" },
};

function matchesFilter(order: Order, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "preparing") return order.status === "confirmed" || order.status === "preparing";
  return order.status === filter;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("new");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyOrder, setBusyOrder] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);

  const loadOrders = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/admin/login");
      return;
    }

    const { data, error } = await supabase
      .from("dessert_orders")
      .select("*, dessert_order_items(id,product_name,quantity,unit_price), dessert_customers(points_balance)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) setMessage("تعذر تحميل الطلبات. اضغط تحديث.");
    else setOrders((data ?? []) as unknown as Order[]);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadOrders(), 0);
    const timer = window.setInterval(() => loadOrders(true), 20000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadOrders]);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase().replace(/\s/g, "");
    return orders.filter((order) => {
      if (!matchesFilter(order, filter)) return false;
      if (!query) return true;
      return String(order.id).includes(query)
        || order.customer_name.toLowerCase().replace(/\s/g, "").includes(query)
        || order.phone_display.replace(/\s/g, "").includes(query);
    });
  }, [orders, filter, search]);

  function countFor(target: Filter) {
    return orders.filter((order) => matchesFilter(order, target)).length;
  }

  async function changeStatus(order: Order, status: OrderStatus) {
    setBusyOrder(order.id);
    setMessage("");
    const { data, error } = await supabase.rpc("dessert_update_order_status", {
      order_id_input: order.id,
      new_status_input: status,
    });
    if (error) setMessage("لم يتم تحديث الطلب. حاول مرة تانية.");
    else {
      const result = data?.[0] as { points_added?: number } | undefined;
      setMessage(status === "delivered" ? `تم التسليم وإضافة ${result?.points_added ?? 0} نقطة للعميل` : "تم تحديث الطلب بنجاح");
      await loadOrders(true);
    }
    setConfirmCancel(null);
    setBusyOrder(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <main className="orders-page">
      <header className="admin-header">
        <div className="admin-brand"><Image src="/waffle-capitano-logo.jpeg" alt="" width={52} height={52} /><div><small>وافل كابيتانو</small><h1>📦 الطلبات</h1></div></div>
        <div className="header-actions">
          <button type="button" onClick={() => loadOrders()} aria-label="تحديث الطلبات">تحديث</button>
          <button type="button" onClick={logout}>خروج</button>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-tools">
          <label className="admin-search"><span>🔎</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث برقم الطلب أو الهاتف أو اسم العميل" /></label>
          <button type="button" className="add-purchase" onClick={() => setStoreOpen(true)}>＋ إضافة شراء من المحل</button>
        </div>

        <div className="status-tabs" role="tablist" aria-label="حالات الطلبات">
          {filters.map((item) => (
            <button type="button" role="tab" aria-selected={filter === item.id} className={filter === item.id ? "active" : ""} key={item.id} onClick={() => setFilter(item.id)}>
              <span>{item.icon}</span><b>{item.label}</b><i>{countFor(item.id)}</i>
            </button>
          ))}
        </div>

        {message && <div className="admin-message" role="status">{message}<button type="button" onClick={() => setMessage("")}>×</button></div>}

        {loading ? (
          <div className="admin-empty"><span>⏳</span><p>جاري تحميل الطلبات...</p></div>
        ) : visibleOrders.length === 0 ? (
          <div className="admin-empty"><span>📭</span><h2>مفيش طلبات هنا</h2><p>{search ? "جرّب تكتب رقم أو اسم مختلف" : "الطلبات الجديدة هتظهر هنا تلقائيًا"}</p></div>
        ) : (
          <div className="orders-list">
            {visibleOrders.map((order) => (
              <article className={`admin-order status-${order.status}`} key={order.id}>
                <div className="order-heading">
                  <div><span className="order-number">طلب #{order.id}</span><small>{formatTime(order.created_at)}</small></div>
                  <span className={`status-badge status-${order.status}`}>{statusText[order.status]}</span>
                </div>
                <div className="customer-details">
                  <p><span>العميل</span><b>{order.customer_name}</b></p>
                  <a href={`tel:${order.phone_display}`}><span>الهاتف</span><b dir="ltr">{order.phone_display}</b></a>
                  <p><span>العنوان</span><b>{order.address}</b></p>
                  <p><span>رصيد النقاط</span><b>{order.dessert_customers?.points_balance ?? 0} نقطة</b></p>
                </div>
                {order.dessert_order_items?.length > 0 ? (
                  <div className="admin-items">
                    {order.dessert_order_items.map((item) => <p key={item.id}><b>{item.quantity} ×</b> {item.product_name}<span>{Number(item.unit_price) * item.quantity} جنيه</span></p>)}
                  </div>
                ) : <div className="store-order-note">🛍️ شراء مباشر من المحل</div>}
                <div className="admin-total"><span>الإجمالي</span><strong>{Number(order.total)} جنيه</strong></div>
                <div className="order-actions">
                  {nextAction[order.status] && (
                    <button type="button" className="next-status" disabled={busyOrder === order.id} onClick={() => changeStatus(order, nextAction[order.status]!.status)}>
                      {busyOrder === order.id ? "جاري التحديث..." : nextAction[order.status]!.label}
                    </button>
                  )}
                  {!(["delivered", "cancelled"] as OrderStatus[]).includes(order.status) && (
                    <button
                      type="button"
                      className="cancel-order"
                      disabled={busyOrder === order.id}
                      onClick={() => confirmCancel === order.id ? changeStatus(order, "cancelled") : setConfirmCancel(order.id)}
                    >
                      {confirmCancel === order.id ? "اضغط مرة ثانية للتأكيد" : "إلغاء الطلب"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {storeOpen && <StorePurchaseModal onClose={() => setStoreOpen(false)} onSaved={() => { setStoreOpen(false); setMessage("تم تسجيل الشراء وإضافة النقاط لنفس العميل"); loadOrders(true); }} />}
    </main>
  );
}

function StorePurchaseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [total, setTotal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const expectedPoints = Math.floor((Number(total) || 0) / 100);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: saveError } = await supabase.rpc("dessert_register_store_purchase", {
      customer_name_input: name.trim(),
      customer_phone_input: phone.trim(),
      purchase_total_input: Number(total),
    });
    if (saveError) {
      setError("تعذر تسجيل الشراء. راجع البيانات وحاول مرة تانية.");
      setLoading(false);
      return;
    }
    onSaved();
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="store-modal" onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="store-title">
        <div className="modal-title"><div><small>مشتريات المحل</small><h2 id="store-title">إضافة شراء</h2></div><button type="button" onClick={onClose} aria-label="إغلاق">×</button></div>
        <p>اكتب نفس رقم موبايل العميل عشان النقاط تروح لنفس حسابه.</p>
        <label>اسم العميل<input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} placeholder="مثال: محمد أحمد" /></label>
        <label>رقم الهاتف<input value={phone} onChange={(event) => setPhone(event.target.value)} required inputMode="tel" dir="ltr" placeholder="01XXXXXXXXX" /></label>
        <label>قيمة الشراء<input value={total} onChange={(event) => setTotal(event.target.value)} required inputMode="decimal" type="number" min="1" max="100000" placeholder="350" /></label>
        <div className="points-preview">⭐ هيتضاف للعميل: <b>{expectedPoints} نقطة</b></div>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button className="admin-primary" type="submit" disabled={loading}>{loading ? "جاري الحفظ..." : "حفظ الشراء وإضافة النقاط"}</button>
      </form>
    </div>
  );
}
