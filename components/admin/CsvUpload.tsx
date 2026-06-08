"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SitePill } from "@/components/shared/SiteColorDot";
import { formatCurrency } from "@/lib/utils";

interface ParsedRow {
  promoCode: string;
  siteId: string | null;
  siteName: string | null;
  siteColor: string | null;
  matched: boolean;
  signups: number;
  depositors: number;
  signupToDepPct: number | null;
  traders: number;
  qualified: number;
  signupToQualPct: number | null;
  cpa: number;
  cost: number;
  raw: Record<string, string>;
}

export function CsvUpload({ offers }: { offers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [offerId, setOfferId] = useState(offers[0]?.id ?? "");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [duplicateStrategy, setDuplicateStrategy] = useState<"skip" | "overwrite">("skip");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const content = await file.text();
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "parse", content }),
    });
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows);
    } else {
      alert("Failed to parse CSV");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "text/plain": [".txt"] },
    multiple: false,
  });

  const confirm = async () => {
    if (!offerId || !periodStart || !periodEnd || !rows) {
      alert("Select an offer and date period first.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          offerId,
          periodStart,
          periodEnd,
          duplicateStrategy,
          rows: rows.map((r) => ({
            promoCode: r.promoCode,
            siteId: r.siteId,
            signups: r.signups,
            depositors: r.depositors,
            traders: r.traders,
            qualified: r.qualified,
            cpa: r.cpa,
            cost: r.cost,
            raw: r.raw,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Imported ${data.imported}, overwritten ${data.overwritten}, skipped ${data.skipped}.`);
        setRows(null);
        setFileName(null);
        router.refresh();
      } else {
        alert(data.error || "Import failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const matchedCount = rows?.filter((r) => r.matched).length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-navy">Upload Conversions CSV</h2>
        <p className="text-sm text-[#6B7280]">
          Import advertiser dashboard exports. Promo codes auto-match to media sites.
        </p>
      </div>

      <Card>
        <CardBody>
          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              isDragActive ? "border-indigo bg-[#F5F3FF]" : "border-cardborder bg-[#F8F9FF]"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud size={36} className="text-indigo" />
            {fileName ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                <FileText size={16} /> {fileName}
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-navy">Drop CSV here or click to browse</p>
                <p className="text-xs text-[#9CA3AF]">
                  Expected: Promo Code, Signups, Depositors, Signup→Dep %, Traders, Qualified, Signup→Qual %, CPA, Cost
                </p>
              </>
            )}
          </div>

          {result && (
            <div className="mt-4 rounded-lg border border-[#86EFAC] bg-[#F0FDF4] px-4 py-3 text-sm font-semibold text-[#16A34A]">
              {result}
            </div>
          )}
        </CardBody>
      </Card>

      {rows && (
        <>
          <Card>
            <CardBody>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label>Offer</Label>
                  <Select value={offerId} onChange={(e) => setOfferId(e.target.value)}>
                    {offers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Period Start</Label>
                  <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                </div>
                <div>
                  <Label>Period End</Label>
                  <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                </div>
                <div>
                  <Label>On Duplicate</Label>
                  <Select value={duplicateStrategy} onChange={(e) => setDuplicateStrategy(e.target.value as "skip" | "overwrite")}>
                    <option value="skip">Skip existing</option>
                    <option value="overwrite">Overwrite existing</option>
                  </Select>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <span className="text-xs font-medium text-[#888]">
                {matchedCount}/{rows.length} matched
              </span>
            </CardHeader>
            <div className="cv-scroll overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr>
                    {["Match", "Promo Code", "Site", "Signups", "Depositors", "Traders", "Qualified", "CPA", "Cost"].map((h, i) => (
                      <th key={h} className={`border-b border-cardborder bg-[#F8F9FF] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6B7280] ${i >= 3 ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-[#F3F4F6]">
                      <td className="px-4 py-3">
                        {r.matched ? (
                          <CheckCircle2 size={16} className="text-success" />
                        ) : (
                          <AlertTriangle size={16} className="text-[#F59E0B]" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-navy">{r.promoCode || "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        {r.matched && r.siteName ? (
                          <SitePill name={r.siteName} color={r.siteColor ?? "#9CA3AF"} />
                        ) : (
                          <span className="text-xs text-[#9CA3AF]">Unmatched (will import without site)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{r.signups}</td>
                      <td className="px-4 py-3 text-right text-sm">{r.depositors}</td>
                      <td className="px-4 py-3 text-right text-sm">{r.traders}</td>
                      <td className="px-4 py-3 text-right text-sm">{r.qualified}</td>
                      <td className="px-4 py-3 text-right text-sm">{formatCurrency(r.cpa)}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-navy">{formatCurrency(r.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRows(null); setFileName(null); }}>
              Cancel
            </Button>
            <Button variant="green" onClick={confirm} disabled={busy}>
              {busy ? "Importing…" : "Confirm Import"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
