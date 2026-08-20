"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const WHATSAPP_NUMBER = "201142013975";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  available: boolean;
  sort_order: number;
  image_path?: string | null;
  image_position_x?: number;
  image_position_y?: number;
  image_zoom?: number;
};

type CartItem = Product & { quantity: number };

const categoryLabels: Record<string, string> = {
  waffle: "وافل",
  freska: "فريسكا",
  pancake: "بان كيك",
  extras: "إضافات",
  cake: "كيك",
  snacks: "سناكس",
};

const menuGroups = [
  { id: "waffle", label: "منيو الوافل", categories: ["waffle", "freska", "pancake", "extras"] },
  { id: "dessert", label: "منيو الديزرت", categories: ["cake", "snacks"] },
] as const;

const fallbackProducts: Product[] = [
  { id: "w1", name: "وافل كلاسيك شوكليت", category: "waffle", price: 80, available: true, sort_order: 1 },
  { id: "w2", name: "وافل وايت شوكليت", category: "waffle", price: 85, available: true, sort_order: 2 },
  { id: "w3", name: "وافل إكسترا", category: "waffle", price: 90, available: true, sort_order: 3 },
  { id: "w4", name: "وافل لوتس", category: "waffle", price: 90, available: true, sort_order: 4 },
  { id: "w5", name: "وافل حشو داخلي وخارجي", category: "waffle", price: 100, available: true, sort_order: 5 },
  { id: "w6", name: "وافل إسبيشيال", category: "waffle", price: 150, available: true, sort_order: 6 },
  { id: "w7", name: "وافل فور سيزون", category: "waffle", price: 100, available: true, sort_order: 7 },
  { id: "w8", name: "وافل بلابر ميكس وايت ونوتيلا", category: "waffle", price: 80, available: true, sort_order: 8 },
  { id: "w9", name: "وافل بلابر كابيتانو", category: "waffle", price: 120, available: true, sort_order: 9 },
  { id: "w10", name: "وافل لابوبو بستاشيو", category: "waffle", price: 150, available: true, sort_order: 10 },
  { id: "w11", name: "وافل طبقتين (مناسبات)", category: "waffle", price: 200, available: true, sort_order: 11 },
  { id: "f1", name: "فريسكا نوتيلا", category: "freska", price: 50, available: true, sort_order: 1 },
  { id: "f2", name: "فريسكا وايت", category: "freska", price: 50, available: true, sort_order: 2 },
  { id: "f3", name: "فريسكا ميكس", category: "freska", price: 50, available: true, sort_order: 3 },
  { id: "f4", name: "فريسكا لوتس", category: "freska", price: 55, available: true, sort_order: 4 },
  { id: "f5", name: "فريسكا إكسترا", category: "freska", price: 70, available: true, sort_order: 5 },
  { id: "c1", name: "كب تريفل", category: "cake", price: 30, available: true, sort_order: 1 },
  { id: "c2", name: "قشطوطة نوتيلا أو وايت", category: "cake", price: 85, available: true, sort_order: 2 },
  { id: "c3", name: "قشطوطة نوتيلا ووايت وفواكه", category: "cake", price: 100, available: true, sort_order: 3 },
  { id: "c4", name: "الفرقعة", category: "cake", price: 110, available: true, sort_order: 4 },
  { id: "c5", name: "مولتن كيك", category: "cake", price: 90, available: true, sort_order: 5 },
  { id: "c6", name: "منجاوي", category: "cake", price: 90, available: true, sort_order: 6 },
  { id: "c7", name: "كب السعادة", category: "cake", price: 50, available: true, sort_order: 7 },
  { id: "c8", name: "ميكس بوكس", category: "cake", price: 110, available: true, sort_order: 8 },
  { id: "s1", name: "كوكيز محشوة", category: "snacks", price: 20, available: true, sort_order: 1 },
  { id: "s2", name: "شوكولاتة لابوبو", category: "snacks", price: 20, available: true, sort_order: 2 },
  { id: "p1", name: "ميني بان كيك 12 قطعة", category: "pancake", price: 70, available: true, sort_order: 1 },
  { id: "p2", name: "ميني بان كيك 24 قطعة", category: "pancake", price: 140, available: true, sort_order: 2 },
  { id: "e1", name: "صوص", category: "extras", price: 5, available: true, sort_order: 1 },
  { id: "e2", name: "صوص للكتابة", category: "extras", price: 20, available: true, sort_order: 2 },
  { id: "e3", name: "فواكه", category: "extras", price: 10, available: true, sort_order: 3 },
];

const PRODUCT_BUCKET = "dessert-products";

function productImageUrl(path?: string | null) {
  if (!path) return null;
  return supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl;
}

function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function OrderButton({ children, className = "button primary", onClick }: { children: React.ReactNode; className?: string; onClick: () => void }) {
  return (
    <button type="button" className={className} onClick={onClick}>
      <span className="wa-dot" aria-hidden="true" />
      {children}
      <span aria-hidden="true">←</span>
    </button>
  );
}

function Navbar({ onOrder, cartCount }: { onOrder: () => void; cartCount: number }) {
  const [open, setOpen] = useState(false);
  const links = [
    ["الرئيسية", "#home"],
    ["المنيو", "#menu"],
    ["النقاط", "#loyalty"],
    ["عننا", "#about"],
    ["مكاننا", "#location"],
  ];
  return (
    <header className="site-header">
      <nav className="nav shell" aria-label="التنقل الرئيسي">
        <a href="#home" className="brand-mini" aria-label="وافل كابيتانو - الرئيسية">
          <Image src="/waffle-capitano-logo.jpeg" alt="شعار وافل كابيتانو" width={92} height={92} sizes="46px" unoptimized />
          <span><b>وافل كابيتانو</b><small>الحلو × مكانه</small></span>
        </a>
        <div className={`nav-links ${open ? "open" : ""}`}>
          {links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        </div>
        <OrderButton className="button primary nav-order" onClick={onOrder}>اطلب دلوقتي {cartCount > 0 && `(${cartCount})`}</OrderButton>
        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="فتح القائمة">
          <span /><span /><span />
        </button>
      </nav>
    </header>
  );
}

function Hero({ onOrder }: { onOrder: () => void }) {
  return (
    <section className="hero" id="home">
      <div className="hero-orb orb-one" aria-hidden="true" />
      <div className="hero-orb orb-two" aria-hidden="true" />
      <div className="shell hero-grid">
        <div className="hero-copy reveal">
          <div className="eyebrow hero-hashtag"><span /><bdi dir="rtl">#آسفين_للي_بسببنا_تخنانين</bdi></div>
          <h1><em className="hero-name">كابيتانو</em><small className="hero-slogan">الحلو <b>×</b> مكانه</small></h1>
          <p>وافل، فريسكا وديزرت معمولين بحب، وطعم مظبوط . اختار طلبك وسيب الباقي علينا.</p>
          <div className="hero-actions">
            <OrderButton onClick={onOrder}>اطلب دلوقتي على واتساب</OrderButton>
            <a className="button secondary" href="#menu">شوف المنيو <span aria-hidden="true">↓</span></a>
          </div>
          <div className="quick-facts" aria-label="معلومات سريعة">
            <span><b>كل يوم</b> من 2 ظهرًا</span>
            <i />
            <span><b>لحد</b> 2 بعد منتصف الليل</span>
          </div>
        </div>
        <div className="hero-visual reveal">
          <div className="logo-frame">
            <div className="frame-ring" aria-hidden="true" />
            <Image src="/waffle-capitano-logo.jpeg" alt="وافل كابيتانو - الحلو مكانه" width={1254} height={1254} sizes="(max-width: 760px) 90vw, 470px" priority unoptimized />
            <div className="stamp">من قلب<br />برنشت</div>
          </div>
        </div>
      </div>
      <div className="hashtag-track" aria-label="شعار وافل كابيتانو">
        <div>
          <bdi dir="rtl">#آسفين_للي_بسببنا_تخنانين</bdi><b>✦</b><bdi dir="rtl">#الحلو×مكانه</bdi><b>✦</b>
          <bdi dir="rtl">#آسفين_للي_بسببنا_تخنانين</bdi><b>✦</b><bdi dir="rtl">#الحلو×مكانه</bdi><b>✦</b>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, index, onAdd }: { product: Product; index: number; onAdd: (product: Product) => void }) {
  const category = categoryLabels[product.category];
  const imageUrl = productImageUrl(product.image_path);
  return (
    <article className={`product-card ${imageUrl ? "has-product-image" : ""}`} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
      {imageUrl && (
        <div className="product-image">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 760px) calc(100vw - 44px), 32vw"
            style={{
              objectPosition: `${product.image_position_x ?? 50}% ${product.image_position_y ?? 50}%`,
              transform: `scale(${product.image_zoom ?? 1})`,
              transformOrigin: `${product.image_position_x ?? 50}% ${product.image_position_y ?? 50}%`,
            }}
            unoptimized
          />
          <div className="product-top product-image-badges">
            <span className="product-category">{category}</span>
            <span className="availability"><i /> متاح</span>
          </div>
        </div>
      )}
      <div className="product-card-body">
        {!imageUrl && <div className="product-top">
          <span className="product-category">{category}</span>
          <span className="availability"><i /> متاح</span>
        </div>}
        <h3>{product.name}</h3>
        <div className="product-bottom">
          <p className="price"><strong>{product.price}</strong><span>جنيه</span></p>
          <button type="button" className="order-chip" onClick={() => onAdd(product)}>أضف للطلب</button>
        </div>
      </div>
    </article>
  );
}

function MenuSection({ products, onAdd }: { products: Product[]; onAdd: (product: Product) => void }) {
  const [active, setActive] = useState("waffle");
  const productsStartRef = useRef<HTMLDivElement>(null);
  const activeGroup = menuGroups.find((group) => group.id === active) ?? menuGroups[0];
  const visible = useMemo(() => {
    const group = menuGroups.find((item) => item.id === active) ?? menuGroups[0];
    return products
      .filter((product) => product.available && group.categories.some((category) => category === product.category))
      .sort((a, b) => {
        const categoryOrder = group.categories as readonly string[];
        const categoryDifference = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        return categoryDifference || a.sort_order - b.sort_order;
      });
  }, [active, products]);

  function changeMenu(groupId: string) {
    setActive(groupId);
    window.requestAnimationFrame(() => {
      productsStartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <section className="section menu-section" id="menu">
      <div className="shell">
        <div className="section-heading reveal">
          <div><span className="section-kicker">منيو كابيتانو</span><h2>اختار اللي على مزاجك</h2></div>
          <p>دوس «أضف للطلب»، كمل اختياراتك، وبعدها افتح طلبك واكتب بياناتك مرة واحدة.</p>
        </div>
        <div className="category-tabs menu-main-tabs" role="tablist" aria-label="أقسام المنيو">
          {menuGroups.map((group) => (
            <button key={group.id} role="tab" aria-selected={active === group.id} className={active === group.id ? "active" : ""} onClick={() => changeMenu(group.id)}>
              {group.label}
            </button>
          ))}
        </div>
        <p className="menu-group-note" role="status">{activeGroup.id === "waffle" ? "وافل • فريسكا • بان كيك • إضافات" : "كيك وديزرت • سناكس"}</p>
        <div className="product-grid" key={active} ref={productsStartRef}>
          {visible.map((product, index) => <ProductCard key={product.id} product={product} index={index} onAdd={onAdd} />)}
        </div>
      </div>
    </section>
  );
}

function LoyaltySection() {
  const [phone, setPhone] = useState("");
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookupPoints(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPoints(null);

    const { data, error: lookupError } = await supabase.rpc("dessert_lookup_points", {
      customer_phone_input: phone.trim(),
    });

    if (lookupError || !data?.[0]) {
      setError("رقم الموبايل غير صحيح. اكتبه 11 رقم زي 01XXXXXXXXX.");
      setLoading(false);
      return;
    }

    setPoints(Number(data[0].points_balance) || 0);
    setLoading(false);
  }

  return (
    <section className="section loyalty" id="loyalty">
      <div className="shell loyalty-grid">
        <div className="loyalty-copy reveal">
          <span className="section-kicker light">برنامج النقاط</span>
          <h2>كل طلب = نقاط<br />والحلو بيجيب حلو</h2>
          <p>اجمع نقاطك من طلبات واتساب أو من المحل، واستبدلها بهدايا وخصومات. نفس الحساب مربوط برقم موبايلك.</p>
          <div className="loyalty-steps">
            <div><span>01</span><p><b>اطلب</b> أونلاين أو من المحل</p></div>
            <div><span>02</span><p><b>اجمع</b> نقاط مع كل طلب</p></div>
            <div><span>03</span><p><b>استبدل</b> نقاطك بهدايا</p></div>
          </div>
        </div>
        <div className="account-card reveal" aria-label="معرفة رصيد نقاط العميل">
          <div className="account-head">
            <div><small>حساب كابيتانو</small><h3>اعرف نقاطك</h3><p>رقم موبايلك هو رقم حسابك عندنا</p></div>
            <div className="points-star" aria-hidden="true">★</div>
          </div>
          <form className="points-lookup" onSubmit={lookupPoints}>
            <label htmlFor="points-phone">اكتب رقم الموبايل</label>
            <div><input id="points-phone" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" dir="ltr" required placeholder="01XXXXXXXXX" autoComplete="tel" /><button type="submit" disabled={loading}>{loading ? "جاري البحث..." : "اعرض نقاطي"}</button></div>
          </form>
          {error && <p className="points-error" role="alert">{error}</p>}
          {points !== null ? (
            <div className="points-balance real-balance" role="status"><small>رصيدك الحالي</small><p><strong>{points}</strong> نقطة</p><span>{points === 0 ? "أول ما تستلم طلبك هتبدأ تجمع نقاط" : "كل 100 جنيه = نقطة واحدة"}</span></div>
          ) : <p className="account-note">اكتب نفس الرقم اللي بتطلب بيه، وهتظهر نقاطك فورًا من غير اسم أو تفاصيل طلبات.</p>}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="section about" id="about">
      <div className="shell about-grid">
        <div className="about-badge reveal"><span>W</span><b>WAFFLE<br />CAPITANO</b><small>من برنشت لكل حبايبنا</small></div>
        <div className="about-copy reveal">
          <span className="section-kicker">عننا</span>
          <h2>حاجة حلوة معمولة<br />بضمير.. كل مرة</h2>
          <p>في وافل كابيتانو بنحب الحاجة البسيطة اللي معمولة صح: خامات كويسة، طعم طازة، وطلب يتعمل زي ما إنت بتحبه. سمعتنا وسط أهل بلدنا هي أهم حاجة عندنا، ورضاك هو اللي بيخلينا نكمّل.</p>
          <div className="values"><span>طازة دايمًا</span><span>خامات كويسة</span><span>طعم مظبوط</span></div>
        </div>
      </div>
    </section>
  );
}

function LocationSection({ onOrder }: { onOrder: () => void }) {
  return (
    <section className="section location" id="location">
      <div className="shell">
        <div className="location-card reveal">
          <div className="location-main">
            <span className="section-kicker light">مستنيينك</span>
            <h2>الحلو مكانه<br />في برنشت</h2>
            <p>تعالى اختار طلبك من المحل، أو ابعتلنا على واتساب وإحنا هنجهزهولك.</p>
            <OrderButton onClick={onOrder}>ابدأ طلبك</OrderButton>
          </div>
          <div className="contact-list">
            <a href="https://www.google.com/maps/search/?api=1&query=%D8%A8%D8%B1%D9%86%D8%B4%D8%AA+%D9%85%D8%A7%D8%B1%D9%83%D8%AA+%D8%A7%D9%84%D8%AE%D8%A8%D9%8A%D8%B1%D9%8A" target="_blank" rel="noreferrer">
              <span className="contact-icon">⌖</span><p><small>موقعنا</small><b>برنشت، بجوار ماركت الخبيري</b></p><i>↗</i>
            </a>
            <a href="tel:+201142013975"><span className="contact-icon">☎</span><p><small>تواصل معانا</small><b dir="ltr">011 42013975</b></p><i>↗</i></a>
            <div><span className="contact-icon">◷</span><p><small>مواعيد العمل</small><b>من 2 ظهرًا إلى 2 بعد منتصف الليل</b></p></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CartDrawer({
  open,
  items,
  onClose,
  onChangeQuantity,
  onClear,
}: {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onChangeQuantity: (id: string, quantity: number) => void;
  onClear: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("اختار منتج واحد على الأقل من المنيو");
      return;
    }

    setSubmitting(true);
    const { data, error: orderError } = await supabase.rpc("dessert_create_order", {
      customer_name_input: name.trim(),
      customer_phone_input: phone.trim(),
      customer_address_input: address.trim(),
      order_items_input: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
    });

    if (orderError || !data?.[0]) {
      setError("حصلت مشكلة بسيطة. راجع بياناتك وجرّب مرة تانية.");
      setSubmitting(false);
      return;
    }

    const savedOrder = data[0] as { order_number: number; order_total: number };
    const itemLines = items.map((item) => `${item.quantity} × ${item.name} — ${item.price * item.quantity} جنيه`).join("\n");
    const message = [
      `السلام عليكم، ده طلب جديد من موقع وافل كابيتانو`,
      `رقم الطلب: #${savedOrder.order_number}`,
      `الاسم: ${name.trim()}`,
      `الهاتف: ${phone.trim()}`,
      `العنوان: ${address.trim()}`,
      "",
      "تفاصيل الطلب:",
      itemLines,
      "",
      `الإجمالي: ${Number(savedOrder.order_total)} جنيه`,
    ].join("\n");

    onClear();
    setSubmitting(false);
    window.location.href = whatsappUrl(message);
  }

  if (!open) return null;

  return (
    <div className="cart-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="cart-header">
          <div><small>خطوات بسيطة</small><h2 id="cart-title">طلبك</h2></div>
          <button type="button" className="cart-close" onClick={onClose} aria-label="إغلاق">×</button>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <span>🧇</span>
            <h3>لسه ما اخترتش حاجة</h3>
            <p>اقفل النافذة واختار اللي تحبه من المنيو.</p>
            <button type="button" className="button primary" onClick={() => { onClose(); document.querySelector("#menu")?.scrollIntoView(); }}>اختار من المنيو</button>
          </div>
        ) : (
          <form onSubmit={submitOrder} className="order-form">
            <div className="cart-items">
              {items.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div><b>{item.name}</b><span>{item.price * item.quantity} جنيه</span></div>
                  <div className="quantity-control" aria-label={`كمية ${item.name}`}>
                    <button type="button" onClick={() => onChangeQuantity(item.id, item.quantity - 1)} aria-label="تقليل الكمية">−</button>
                    <strong>{item.quantity}</strong>
                    <button type="button" onClick={() => onChangeQuantity(item.id, item.quantity + 1)} aria-label="زيادة الكمية">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-total"><span>الإجمالي</span><strong>{total} جنيه</strong></div>
            <p className="form-help">اكتب بيانات بسيطة عشان نسجل طلبك ونجهزه بسرعة.</p>
            <label className="field-label">اسمك
              <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} placeholder="مثال: محمد أحمد" autoComplete="name" />
            </label>
            <label className="field-label">رقم الموبايل
              <input value={phone} onChange={(event) => setPhone(event.target.value)} required inputMode="tel" placeholder="01XXXXXXXXX" autoComplete="tel" dir="ltr" />
            </label>
            <label className="field-label">العنوان بالتفصيل
              <textarea value={address} onChange={(event) => setAddress(event.target.value)} required minLength={4} maxLength={300} placeholder="القرية، الشارع، علامة مميزة" rows={3} />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button primary submit-order" type="submit" disabled={submitting}>
              {submitting ? "جاري تسجيل الطلب..." : "مواصلة الطلب في واتساب"}
            </button>
            <p className="privacy-note">بعد التسجيل هيفتح واتساب، وإنت هتضغط إرسال بنفسك.</p>
          </form>
        )}
      </aside>
    </div>
  );
}

function Footer() {
  return (
    <footer>
      <div className="shell footer-grid">
        <a href="#home" className="footer-brand"><Image src="/waffle-capitano-logo.jpeg" alt="" width={104} height={104} sizes="52px" unoptimized /><span><b>وافل كابيتانو</b><small>#الحلو×مكانه</small></span></a>
        <div className="footer-links"><a href="#menu">المنيو</a><a href="#loyalty">النقاط</a><a href="#about">عننا</a><a href="#location">مكاننا</a></div>
        <p>© {new Date().getFullYear()} وافل كابيتانو. كل الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState("");
  const [menuProducts, setMenuProducts] = useState<Product[]>(fallbackProducts);

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, 20) } : item);
      return [...current, { ...product, quantity: 1 }];
    });
    setAddedNotice(`تم إضافة «${product.name}» — كمل اختيارك`);
  }

  function changeQuantity(id: string, quantity: number) {
    if (quantity <= 0) setCart((current) => current.filter((item) => item.id !== id));
    else setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.min(quantity, 20) } : item));
  }

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")), { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!addedNotice) return;
    const timer = window.setTimeout(() => setAddedNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [addedNotice]);

  useEffect(() => {
    let active = true;
    async function loadMenu() {
      const { data, error } = await supabase
        .from("dessert_products")
        .select("id,name,category,price,available,sort_order,image_path,image_position_x,image_position_y,image_zoom")
        .eq("available", true)
        .order("category")
        .order("sort_order");
      if (!active || error || !data?.length) return;
      const nextProducts = data.map((product) => ({ ...product, price: Number(product.price) })) as Product[];
      setMenuProducts(nextProducts);
      setCart((current) => current.flatMap((item) => {
        const freshProduct = nextProducts.find((product) => product.id === item.id);
        return freshProduct ? [{ ...freshProduct, quantity: item.quantity }] : [];
      }));
    }
    loadMenu();
    return () => { active = false; };
  }, []);

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "DessertShop",
    name: "وافل كابيتانو",
    image: "/waffle-capitano-logo.jpeg",
    telephone: "+201142013975",
    address: { "@type": "PostalAddress", streetAddress: "برنشت، بجوار ماركت الخبيري", addressCountry: "EG" },
    openingHours: "Mo-Su 14:00-02:00",
    priceRange: "ج.م",
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      <Navbar onOrder={() => setCartOpen(true)} cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} />
      <Hero onOrder={() => document.querySelector("#menu")?.scrollIntoView()} />
      <MenuSection products={menuProducts} onAdd={addToCart} />
      <LoyaltySection />
      <AboutSection />
      <LocationSection onOrder={() => setCartOpen(true)} />
      <Footer />
      {addedNotice && <div className="cart-added-toast" role="status">✓ {addedNotice}</div>}
      {cart.length > 0 && <OrderButton className="floating-whatsapp" onClick={() => setCartOpen(true)}><span className="floating-label">طلبك ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span></OrderButton>}
      <CartDrawer open={cartOpen} items={cart} onClose={() => setCartOpen(false)} onChangeQuantity={changeQuantity} onClear={() => setCart([])} />
    </main>
  );
}
