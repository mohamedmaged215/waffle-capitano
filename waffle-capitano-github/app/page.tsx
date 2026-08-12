"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const WHATSAPP_NUMBER = "201142013975";

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  available: boolean;
  sort_order: number;
};

const categories = [
  { id: "all", label: "الكل" },
  { id: "waffle", label: "وافل" },
  { id: "freska", label: "فريسكا" },
  { id: "cake", label: "كيك وديزرت" },
  { id: "snacks", label: "سناكس" },
  { id: "pancake", label: "بان كيك" },
  { id: "extras", label: "إضافات" },
];

const products: Product[] = [
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

function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function WhatsAppLink({ children, className = "button primary", message }: { children: React.ReactNode; className?: string; message?: string }) {
  return (
    <a
      href={whatsappUrl(message ?? "السلام عليكم، عايز أطلب من وافل كابيتانو.")}
      className={className}
      target="_blank"
      rel="noreferrer"
      aria-label={`${children} — يفتح واتساب`}
    >
      <span className="wa-dot" aria-hidden="true" />
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function Navbar() {
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
          <Image src="/waffle-capitano-logo.jpeg" alt="شعار وافل كابيتانو" width={92} height={92} sizes="46px" />
          <span><b>وافل كابيتانو</b><small>الحلو × مكانه</small></span>
        </a>
        <div className={`nav-links ${open ? "open" : ""}`}>
          {links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        </div>
        <WhatsAppLink className="button primary nav-order">اطلب دلوقتي</WhatsAppLink>
        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="فتح القائمة">
          <span /><span /><span />
        </button>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-orb orb-one" aria-hidden="true" />
      <div className="hero-orb orb-two" aria-hidden="true" />
      <div className="shell hero-grid">
        <div className="hero-copy reveal">
          <div className="eyebrow"><span /> طعم يخليك ترجع تاني</div>
          <h1>مزاجك الحلو<br /><em>عند كابيتانو</em></h1>
          <p>وافل، فريسكا وديزرت معمولين بحب، بطعم مظبوط وأسعار واضحة. اختار طلبك وسيب الباقي علينا.</p>
          <div className="hero-actions">
            <WhatsAppLink>اطلب دلوقتي على واتساب</WhatsAppLink>
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
            <Image src="/waffle-capitano-logo.jpeg" alt="وافل كابيتانو - الحلو مكانه" width={1576} height={1576} sizes="(max-width: 760px) 90vw, 470px" priority />
            <div className="stamp">من قلب<br />برنشت</div>
          </div>
        </div>
      </div>
      <div className="hashtag-track" aria-label="شعار وافل كابيتانو">
        <div>
          <span>#آسفين_للي_بيسيبنا_تخنانين</span><b>✦</b><span>#الحلو×مكانه</span><b>✦</b>
          <span>#آسفين_للي_بيسيبنا_تخنانين</span><b>✦</b><span>#الحلو×مكانه</span><b>✦</b>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const category = categories.find((item) => item.id === product.category)?.label;
  const message = `السلام عليكم، عايز أطلب ${product.name} بسعر ${product.price} جنيه.`;
  return (
    <article className="product-card" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
      <div className="product-top">
        <span className="product-category">{category}</span>
        <span className="availability"><i /> متاح</span>
      </div>
      <h3>{product.name}</h3>
      <div className="product-bottom">
        <p className="price"><strong>{product.price}</strong><span>جنيه</span></p>
        <WhatsAppLink className="order-chip" message={message}>اطلب</WhatsAppLink>
      </div>
    </article>
  );
}

function MenuSection() {
  const [active, setActive] = useState("all");
  const visible = useMemo(() => products.filter((p) => p.available && (active === "all" || p.category === active)), [active]);
  return (
    <section className="section menu-section" id="menu">
      <div className="shell">
        <div className="section-heading reveal">
          <div><span className="section-kicker">منيو كابيتانو</span><h2>اختار اللي على مزاجك</h2></div>
          <p>الأسعار بالجنيه المصري. دوس «اطلب» وهتلاقي اسم المنتج وسعره جاهزين على واتساب.</p>
        </div>
        <div className="category-tabs" role="tablist" aria-label="أقسام المنيو">
          {categories.map((category) => (
            <button key={category.id} role="tab" aria-selected={active === category.id} className={active === category.id ? "active" : ""} onClick={() => setActive(category.id)}>
              {category.label}
            </button>
          ))}
        </div>
        <div className="product-grid" key={active}>
          {visible.sort((a, b) => a.sort_order - b.sort_order).map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
        </div>
      </div>
    </section>
  );
}

function LoyaltySection() {
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
        <div className="account-card reveal" aria-label="نموذج حساب نقاط العميل">
          <div className="account-head">
            <div><small>حساب كابيتانو</small><h3>أهلاً يا محمد</h3><p dir="ltr">010 •••• 2148</p></div>
            <div className="qr-demo" aria-label="مكان كود QR المستقبلي"><span /><span /><span /><span /></div>
          </div>
          <div className="points-balance"><small>رصيدك الحالي</small><p><strong>17</strong> نقطة</p><div><i style={{ width: "70%" }} /></div><span>فاضلك 3 نقط على المكافأة الجاية</span></div>
          <div className="reward-row"><div className="reward-icon">10</div><p><b>علبة جاتوه صغيرة</b><span>10 نقاط</span></p><span className="claimed">متاحة</span></div>
          <div className="reward-row locked"><div className="reward-icon">20</div><p><b>كيلو بسبوسة</b><span>20 نقطة</span></p><span>3 نقط</span></div>
          <p className="account-note">امسح الكود عند الكاشير، ونقاط الزيارة هتضاف لنفس حسابك.</p>
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

function LocationSection() {
  return (
    <section className="section location" id="location">
      <div className="shell">
        <div className="location-card reveal">
          <div className="location-main">
            <span className="section-kicker light">مستنيينك</span>
            <h2>الحلو مكانه<br />في برنشت</h2>
            <p>تعالى اختار طلبك من المحل، أو ابعتلنا على واتساب وإحنا هنجهزهولك.</p>
            <WhatsAppLink>ابدأ طلبك</WhatsAppLink>
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

function Footer() {
  return (
    <footer>
      <div className="shell footer-grid">
        <a href="#home" className="footer-brand"><Image src="/waffle-capitano-logo.jpeg" alt="" width={104} height={104} sizes="52px" /><span><b>وافل كابيتانو</b><small>#الحلو×مكانه</small></span></a>
        <div className="footer-links"><a href="#menu">المنيو</a><a href="#loyalty">النقاط</a><a href="#about">عننا</a><a href="#location">مكاننا</a></div>
        <p>© {new Date().getFullYear()} وافل كابيتانو. كل الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible")), { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
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
      <Navbar />
      <Hero />
      <MenuSection />
      <LoyaltySection />
      <AboutSection />
      <LocationSection />
      <Footer />
      <WhatsAppLink className="floating-whatsapp" message="السلام عليكم، عايز أطلب من وافل كابيتانو."><span className="floating-label">اطلب على واتساب</span></WhatsAppLink>
    </main>
  );
}
