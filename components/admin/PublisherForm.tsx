"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, RefreshCw, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appBaseUrl } from "@/lib/tracking";

interface SiteDraft {
  name: string;
  url: string;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw + "!";
}

export function PublisherForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sites, setSites] = useState<SiteDraft[]>([{ name: "", url: "" }]);
  const [busy, setBusy] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loginUrl = `${appBaseUrl()}/login`;

  const sendEmail = async () => {
    if (!email || !password || !name.trim()) return;
    setEmailStatus("sending");
    setEmailError(null);
    const res = await fetch("/api/send-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, publisherName: name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEmailStatus("failed");
      setEmailError(data.error || "Failed to send email");
      return;
    }
    if (data.sent) {
      setEmailStatus("sent");
      return;
    }
    const msg = data.error || "Email was not sent";
    setEmailError(msg);
    setEmailStatus(msg.includes("not configured") ? "skipped" : "failed");
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const validSites = sites.filter((s) => s.name.trim());
      const res = await fetch("/api/publishers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, sites: validSites }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create publisher");
        return;
      }
      router.refresh();
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step >= s ? "bg-indigo text-white" : "bg-[#E8EAEF] text-[#9CA3AF]"
              }`}
            >
              {s}
            </div>
            <span className={`text-xs font-semibold ${step >= s ? "text-navy" : "text-[#9CA3AF]"}`}>
              {s === 1 ? "Info" : s === 2 ? "Credentials" : "Sites"}
            </span>
            {s < 3 && <div className="ml-1 h-px flex-1 bg-[#E8EAEF]" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label>Publisher / Company Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="TFM Media" />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@tfmmedia.com"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => setStep(2)} disabled={!name.trim() || !email.trim()}>
              Next →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#F8F9FF] px-4 py-3 text-xs text-[#6B7280]">
            Login URL: <span className="font-semibold text-navy">{loginUrl}</span>
          </div>
          <div>
            <Label>Email (login)</Label>
            <Input value={email} disabled className="opacity-70" />
          </div>
          <div>
            <Label>Password</Label>
            <div className="flex gap-2">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a password" />
              <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())}>
                <RefreshCw size={14} /> Generate
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant="navy"
            onClick={sendEmail}
            disabled={!password || !name.trim() || emailStatus === "sending"}
            className="w-full"
          >
            {emailStatus === "sent" ? (
              <>
                <Check size={15} /> Credentials sent
              </>
            ) : emailStatus === "skipped" ? (
              <>
                <Mail size={15} /> Email not configured (skipped)
              </>
            ) : emailStatus === "failed" ? (
              <>
                <Mail size={15} /> Send failed — try again
              </>
            ) : (
              <>
                <Mail size={15} /> Send Credentials via Email
              </>
            )}
          </Button>
          {emailError && emailStatus !== "sent" && (
            <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">
              {emailError}
            </div>
          )}
          <div className="flex justify-between gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={password.length < 6}>
              Next →
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-[#6B7280]">
            Add media sites. Each gets the next color from the palette. You can add more later.
          </p>
          <div className="space-y-2">
            {sites.map((site, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={site.name}
                  onChange={(e) =>
                    setSites(sites.map((s, j) => (j === i ? { ...s, name: e.target.value } : s)))
                  }
                  placeholder="Site name (e.g. VICE)"
                />
                <Input
                  value={site.url}
                  onChange={(e) =>
                    setSites(sites.map((s, j) => (j === i ? { ...s, url: e.target.value } : s)))
                  }
                  placeholder="URL (optional)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSites(sites.filter((_, j) => j !== i))}
                >
                  <Trash2 size={15} className="text-[#EF4444]" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setSites([...sites, { name: "", url: "" }])}>
            <Plus size={14} /> Add Site
          </Button>

          {error && (
            <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#DC2626]">
              {error}
            </div>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button variant="green" onClick={submit} disabled={busy}>
              {busy ? "Creating…" : "Create Publisher"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
