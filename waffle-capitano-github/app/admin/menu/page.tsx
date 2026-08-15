"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const PRODUCT_BUCKET = "dessert-products";
const MAX_SOURCE_SIZE = 12 * 1024 * 1024;
const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  sort_order: number;
  image_path: string | null;
  updated_at: string;
};

type ProductDraft = {
  name: string;
  price: string;
  category: string;
  available: boolean;
  image_path: string | null;
};

type MenuFilter = "all" | "waffle" | "dessert";

const categories = [
  { id: "waffle", label: "وافل", group: "waffle" },
  { id: "freska", label: "فريسكا", group: "waffle" },
  { id: "pancake", label: "بان كيك", group: "waffle" },
  { id: "extras", label: "إضافات", group: "waffle" },
  { id: "cake", label: "كيك وديزرت", group: "dessert" },
  { id: "snacks", label: "سناكس", group: "dessert" },
] as const;

const emptyDraft: ProductDraft = {
  name: "",
  price: "",
  category: "waffle",
  available: true,
  image_path: null,
};

function categoryLabel(category: string) {
  return categories.find((item) => item.id === category)?.label ?? category;
}

function productImageUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl;
}

function fileToImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذر قراءة الصورة"));
    };
    image.src = url;
  });
}

function canvasToFile(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("تعذر تجهيز الصورة"));
        return;
      }
      resolve(new File([blob], "product.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", quality);
  });
}

async function prepareProductImage(source: File) {
  if (!source.type.startsWith("image/")) throw new Error("اختار ملف صورة فقط");
  if (source.size > MAX_SOURCE_SIZE) throw new Error("الصورة كبيرة جدًا. اختار صورة أقل من 12 ميجا");

  const image = await fileToImage(source);
  const attempts = [
    { maxSide: 1200, quality: 0.82 },
    { maxSide: 950, quality: 0.72 },
  ];

  for (const attempt of attempts) {
    const scale = Math.min(1, attempt.maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("تعذر تجهيز الصورة");
    context.fillStyle = "#fffaf1";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const prepared = await canvasToFile(canvas, attempt.quality);
    if (prepared.size <= MAX_UPLOAD_SIZE) return prepared;
  }

  throw new Error("لم نقدر نصغّر الصورة. جرّب صورة أبسط أو أصغر");
}

export default function AdminMenuPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MenuFilter>("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/admin/login");
      return;
    }

    const { data, error } = await supabase
      .from("dessert_products")
      .select("id,name,category,price,available,sort_order,image_path,updated_at")
      .order("category")
      .order("sort_order")
      .order("name");

    if (error) setMessage("تعذر تحميل المنيو. اضغط تحديث وحاول مرة ثانية.");
    else {
      setProducts((data ?? []).map((item) => ({ ...item, price: Number(item.price) })) as Product[]);
      setMessage("");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(loadProducts, 0);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const productGroup = categories.find((item) => item.id === product.category)?.group;
      if (filter !== "all" && productGroup !== filter) return false;
      if (!query) return true;
      return product.name.toLowerCase().includes(query) || categoryLabel(product.category).includes(query);
    });
  }, [filter, products, search]);

  function openNewProduct() {
    setEditing(null);
    setDraft(emptyDraft);
    setImageFile(null);
    setRemoveImage(false);
    setMessage("");
    setEditorOpen(true);
  }

  function openProduct(product: Product) {
    setEditing(product);
    setDraft({
      name: product.name,
      price: String(product.price),
      category: product.category,
      available: product.available,
      image_path: product.image_path,
    });
    setImageFile(null);
    setRemoveImage(false);
    setMessage("");
    setEditorOpen(true);
  }

  function closeEditor() {
    if (saving) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setEditorOpen(false);
    setEditing(null);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
  }

  function chooseImage(file: File | null) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
    if (file) setRemoveImage(false);
  }

  async function uploadImage(productId: string, source: File) {
    const prepared = await prepareProductImage(source);
    const path = `${productId}/${Date.now()}-${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, prepared, {
      cacheControl: "3600",
      contentType: "image/jpeg",
      upsert: false,
    });
    if (error) throw new Error("تعذر رفع الصورة. جرّب مرة ثانية");
    return path;
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const name = draft.name.trim();
    const price = Number(draft.price);
    if (name.length < 2 || name.length > 100) {
      setMessage("اكتب اسم المنتج بشكل صحيح");
      return;
    }
    if (!Number.isFinite(price) || price < 0 || price > 100000) {
      setMessage("اكتب سعرًا صحيحًا");
      return;
    }

    setSaving(true);
    const productId = editing?.id ?? `m-${crypto.randomUUID()}`;
    const oldImagePath = editing?.image_path ?? null;
    let uploadedPath: string | null = null;

    try {
      if (imageFile) uploadedPath = await uploadImage(productId, imageFile);
      const imagePath = uploadedPath ?? (removeImage ? null : draft.image_path);
      const maxOrder = products
        .filter((product) => product.category === draft.category)
        .reduce((max, product) => Math.max(max, product.sort_order), 0);
      const payload = {
        id: productId,
        name,
        category: draft.category,
        price,
        available: draft.available,
        sort_order: editing?.sort_order ?? maxOrder + 1,
        image_path: imagePath,
        updated_at: new Date().toISOString(),
      };

      const query = editing
        ? supabase.from("dessert_products").update(payload).eq("id", productId)
        : supabase.from("dessert_products").insert(payload);
      const { data, error } = await query
        .select("id,name,category,price,available,sort_order,image_path,updated_at")
        .single();
      if (error || !data) throw new Error("تعذر حفظ المنتج. جرّب مرة ثانية");

      if (oldImagePath && oldImagePath !== imagePath) {
        await supabase.storage.from(PRODUCT_BUCKET).remove([oldImagePath]);
      }

      const saved = { ...data, price: Number(data.price) } as Product;
      setProducts((current) => {
        const exists = current.some((product) => product.id === saved.id);
        return exists
          ? current.map((product) => product.id === saved.id ? saved : product)
          : [...current, saved];
      });
      setMessage(editing ? "تم حفظ تعديل المنتج" : "تمت إضافة المنتج للمنيو");
      setEditorOpen(false);
      setEditing(null);
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setRemoveImage(false);
    } catch (error) {
      if (uploadedPath) await supabase.storage.from(PRODUCT_BUCKET).remove([uploadedPath]);
      setMessage(error instanceof Error ? error.message : "تعذر حفظ المنتج");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(product: Product) {
    setBusyId(product.id);
    setMessage("");
    const nextAvailable = !product.available;
    const { error } = await supabase
      .from("dessert_products")
      .update({ available: nextAvailable, updated_at: new Date().toISOString() })
      .eq("id", product.id);
    if (error) setMessage("تعذر تغيير حالة المنتج. حاول مرة ثانية.");
    else {
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, available: nextAvailable } : item));
      setMessage(nextAvailable ? "المنتج متاح الآن في الموقع" : "تم إخفاء المنتج من الموقع");
    }
    setBusyId(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  const currentImage = imagePreview ?? (!removeImage ? productImageUrl(draft.image_path) : null);

  return (
    <main className="orders-page menu-admin-page">
      <header className="admin-header">
        <div className="admin-brand"><Image src="/waffle-capitano-logo.jpeg" alt="" width={52} height={52} unoptimized /><div><small>وافل كابيتانو</small><h1>🍽️ المنيو</h1></div></div>
        <div className="header-actions">
          <button type="button" onClick={loadProducts}>تحديث</button>
          <button type="button" onClick={logout}>خروج</button>
        </div>
      </header>

      <section className="admin-content">
        <nav className="admin-module-nav" aria-label="أقسام لوحة الموظف">
          <Link href="/admin/orders">📦 الطلبات</Link>
          <Link className="active" href="/admin/menu">🍽️ المنيو</Link>
          <Link href="/admin/customers">⭐ نقاط العملاء</Link>
          <Link href="/admin/revenue">💰 الإيرادات</Link>
        </nav>

        <div className="menu-admin-tools">
          <label className="admin-search"><span>🔎</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث باسم المنتج" /></label>
          <button type="button" className="add-purchase" onClick={openNewProduct}>＋ إضافة منتج</button>
        </div>

        <div className="menu-filter-tabs" role="tablist" aria-label="أقسام المنيو">
          <button type="button" role="tab" aria-selected={filter === "all"} className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>الكل <b>{products.length}</b></button>
          <button type="button" role="tab" aria-selected={filter === "waffle"} className={filter === "waffle" ? "active" : ""} onClick={() => setFilter("waffle")}>منيو الوافل</button>
          <button type="button" role="tab" aria-selected={filter === "dessert"} className={filter === "dessert" ? "active" : ""} onClick={() => setFilter("dessert")}>منيو الديزرت</button>
        </div>

        {message && <div className="admin-message" role="status">{message}</div>}
        {loading ? <div className="admin-loading">جاري تحميل المنيو...</div> : (
          <div className="admin-product-grid">
            {visibleProducts.map((product) => {
              const imageUrl = productImageUrl(product.image_path);
              return (
                <article className={`admin-product-card ${product.available ? "" : "is-hidden"}`} key={product.id}>
                  <div className={`admin-product-media ${imageUrl ? "has-image" : ""}`}>
                    {imageUrl ? <Image src={imageUrl} alt={product.name} fill sizes="(max-width: 700px) 44vw, 240px" unoptimized /> : <span aria-hidden="true">🧇</span>}
                    <i>{categoryLabel(product.category)}</i>
                  </div>
                  <div className="admin-product-info">
                    <div><h2>{product.name}</h2><p><strong>{product.price}</strong> جنيه</p></div>
                    <span className={product.available ? "available" : "hidden"}>{product.available ? "متاح" : "مخفي"}</span>
                  </div>
                  <div className="admin-product-actions">
                    <button type="button" onClick={() => openProduct(product)}>تعديل</button>
                    <button type="button" className={product.available ? "hide-product" : "show-product"} disabled={busyId === product.id} onClick={() => toggleAvailability(product)}>
                      {busyId === product.id ? "جاري..." : product.available ? "إخفاء" : "إظهار"}
                    </button>
                  </div>
                </article>
              );
            })}
            {visibleProducts.length === 0 && <div className="admin-empty">لا توجد منتجات مطابقة للبحث</div>}
          </div>
        )}
      </section>

      {editorOpen && (
        <div className="admin-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeEditor()}>
          <form className="menu-editor" onSubmit={saveProduct} role="dialog" aria-modal="true" aria-labelledby="menu-editor-title">
            <div className="menu-editor-head"><div><small>{editing ? "تعديل منتج" : "منتج جديد"}</small><h2 id="menu-editor-title">{editing?.name ?? "إضافة منتج للمنيو"}</h2></div><button type="button" onClick={closeEditor} aria-label="إغلاق">×</button></div>

            <div className={`menu-image-picker ${currentImage ? "has-image" : ""}`}>
              {currentImage ? <Image src={currentImage} alt="معاينة صورة المنتج" fill sizes="340px" unoptimized /> : <div><span>📷</span><b>صورة المنتج اختيارية</b><small>تقدر تضيفها الآن أو في أي وقت</small></div>}
            </div>
            <div className="menu-image-actions">
              <label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseImage(event.target.files?.[0] ?? null)} />{currentImage ? "تغيير الصورة" : "اختيار صورة"}</label>
              {currentImage && <button type="button" onClick={() => { chooseImage(null); setRemoveImage(true); }}>حذف الصورة</button>}
            </div>
            <p className="menu-image-help">سنصغّر الصورة تلقائيًا لتفتح بسرعة على الموبايل.</p>

            <label className="field-label">اسم المنتج
              <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required minLength={2} maxLength={100} placeholder="مثال: وافل كلاسيك شوكليت" />
            </label>
            <div className="menu-editor-row">
              <label className="field-label">السعر بالجنيه
                <input value={draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))} required min="0" max="100000" step="0.5" type="number" inputMode="decimal" placeholder="80" />
              </label>
              <label className="field-label">القسم
                <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}>
                  {categories.map((category) => <option value={category.id} key={category.id}>{category.label}</option>)}
                </select>
              </label>
            </div>
            <label className="menu-available-toggle"><input aria-label="المنتج متاح" type="checkbox" checked={draft.available} onChange={(event) => setDraft((current) => ({ ...current, available: event.target.checked }))} /><span><b>المنتج متاح</b><small>اقفل الزر لإخفائه من موقع العميل</small></span></label>
            {message && <p className="form-error" role="alert">{message}</p>}
            <button className="menu-save-button" type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : editing ? "حفظ التعديل" : "إضافة المنتج"}</button>
          </form>
        </div>
      )}
    </main>
  );
}
