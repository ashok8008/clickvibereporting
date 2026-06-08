import Papa from "papaparse";

export interface ParsedConversionRow {
  promoCode: string;
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

function toNumber(value: string | undefined): number {
  if (value == null) return 0;
  const cleaned = value.replace(/[$,%\s]/g, "").trim();
  if (cleaned === "" || cleaned === "—" || cleaned === "-") return 0;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function toPct(value: string | undefined): number | null {
  if (value == null) return null;
  const cleaned = value.replace(/[%\s]/g, "").trim();
  if (cleaned === "" || cleaned === "—" || cleaned === "-") return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Find a header key case-insensitively / fuzzily. */
function pick(row: Record<string, string>, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const cand of candidates) {
    const match = keys.find(
      (k) => k.toLowerCase().replace(/[^a-z%→]/g, "") === cand.toLowerCase().replace(/[^a-z%→]/g, "")
    );
    if (match) return row[match];
  }
  return undefined;
}

export function parseConversionCsv(content: string): ParsedConversionRow[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  return result.data
    .filter((row) => Object.values(row).some((v) => v && v.trim() !== ""))
    .map((row) => {
      const promoCode = (pick(row, ["Promo Code", "PromoCode", "Promo"]) || "").trim();
      return {
        promoCode,
        signups: toNumber(pick(row, ["Signups"])),
        depositors: toNumber(pick(row, ["Depositors"])),
        signupToDepPct: toPct(pick(row, ["Signup→Dep %", "SignupDep%", "Signup→Dep%", "Sign→Dep%"])),
        traders: toNumber(pick(row, ["Traders"])),
        qualified: toNumber(pick(row, ["Qualified"])),
        signupToQualPct: toPct(pick(row, ["Signup→Qual %", "SignupQual%", "Signup→Qual%", "Sign→Qual%"])),
        cpa: toNumber(pick(row, ["CPA"])),
        cost: toNumber(pick(row, ["Cost", "Total Cost"])),
        raw: row,
      };
    });
}
