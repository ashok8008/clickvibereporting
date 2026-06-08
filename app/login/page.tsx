"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    const session = await getSession();
    router.push(session?.user.role === "ADMIN" ? "/admin" : "/publisher");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-[#1e3a8a] to-[#312e81] p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-cardborder bg-white p-8 shadow-[0_16px_60px_rgba(13,27,75,0.25)]">
          <h1 className="text-2xl font-extrabold text-navy">Sign in</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Welcome back. Sign in to your ClickVibe account.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" {...register("email")} />
              {errors.email && (
                <p className="mt-1 text-xs text-[#EF4444]">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && (
                <p className="mt-1 text-xs text-[#EF4444]">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-[#F8F9FF] px-4 py-3 text-xs text-[#6B7280]">
            <p className="font-semibold text-navy">Demo credentials</p>
            <p className="mt-1">Admin — admin@trackcenter.info / Admin123!</p>
            <p>Publisher — tfm@trackcenter.info / Pub123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
