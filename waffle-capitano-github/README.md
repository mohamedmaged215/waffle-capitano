# موقع وافل كابيتانو

موقع عربي متجاوب لمحل وافل كابيتانو، مبني بـ Next.js ومجهز للنشر على Vercel.

## التشغيل محليًا

```bash
npm install
npm run dev
```

افتح `http://localhost:3000`.

## النشر

1. ارفع محتويات المجلد إلى مستودع GitHub.
2. افتح Vercel واختر **Add New → Project**.
3. اختر مستودع GitHub واترك Framework Preset على **Next.js**.
4. اضغط **Deploy**.

## نظام الطلبات

- طلب العميل يُحفظ أولًا في Supabase ثم يفتح واتساب برسالة جاهزة.
- لوحة الموظف موجودة في `/admin/orders`، وواجهة الدخول في `/admin/login`.
- النقاط تُضاف لطلبات واتساب عند التسليم فقط، ومشتريات المحل تُربط بنفس العميل عن طريق رقم الهاتف.

## متغيرات البيئة

انسخ `.env.example` إلى `.env.local` عند التشغيل محليًا. على Vercel أضف القيمتين الآتيتين إذا أردت تغيير مشروع Supabase المرتبط:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

لا تضع كلمة مرور الموظف داخل GitHub أو ملفات المشروع.
