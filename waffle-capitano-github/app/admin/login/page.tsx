"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { STAFF_EMAIL, supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/admin/orders");
    });
  }, [router]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: STAFF_EMAIL,
      password,
    });
    if (loginError) {
      setError("كلمة المرور غير صحيحة");
      setLoading(false);
      return;
    }
    router.replace("/admin/orders");
  }

  return (
    <main className="admin-login">
      <form className="login-card" onSubmit={login}>
        <Image src="/waffle-capitano-logo.jpeg" alt="وافل كابيتانو" width={100} height={100} priority />
        <div><span>لوحة الموظف</span><h1>أهلاً بيك</h1><p>اكتب كلمة المرور للدخول للطلبات.</p></div>
        <label>كلمة المرور
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="••••••••" autoComplete="current-password" />
        </label>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button type="submit" className="admin-primary" disabled={loading}>{loading ? "جاري الدخول..." : "دخول"}</button>
        <Link href="/">الرجوع للموقع</Link>
      </form>
    </main>
  );
}
