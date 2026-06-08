"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { OfferForm, type OfferFormValues } from "./OfferForm";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface OfferRow {
  _id: string;
  name: string;
  type: string;
  payoutValue: number;
  payoutCurrency: string;
  appsflyerAppId: string;
  advertiserEmail?: string;
  isActive: boolean;
  assignedCount: number;
  createdAt: string;
}

export function OffersClient({ initialOffers }: { initialOffers: OfferRow[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<{ open: boolean; editing: OfferRow | null }>({
    open: false,
    editing: null,
  });

  const save = async (values: OfferFormValues) => {
    const url = modal.editing ? `/api/offers/${modal.editing._id}` : "/api/offers";
    const method = modal.editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      setModal({ open: false, editing: null });
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Failed to save offer");
    }
  };

  const toggleActive = async (offer: OfferRow) => {
    await fetch(`/api/offers/${offer._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !offer.isActive }),
    });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Offers</h2>
          <p className="text-sm text-[#6B7280]">{initialOffers.length} offers · manage advertiser payouts</p>
        </div>
        <Button onClick={() => setModal({ open: true, editing: null })}>
          <Plus size={16} /> New Offer
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>All Offers</CardTitle>
        </CardHeader>
        <div className="cv-scroll overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                {["Offer", "Type", "Payout", "AppsFlyer ID", "Publishers", "Status", "Created", ""].map((h) => (
                  <th key={h} className="border-b border-cardborder bg-[#F8F9FF] px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initialOffers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-[#9CA3AF]">
                    No offers yet. Create your first offer.
                  </td>
                </tr>
              ) : (
                initialOffers.map((o) => (
                  <tr key={o._id} className="border-b border-[#F3F4F6] hover:bg-[#F8F9FF]">
                    <td className="px-4 py-3 text-sm font-bold text-navy">{o.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge color="#6366F1">{o.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-success">
                      {formatCurrency(o.payoutValue, o.payoutCurrency)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{o.appsflyerAppId}</td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{o.assignedCount}</td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => toggleActive(o)}>
                        <Badge color={o.isActive ? "#22C55E" : "#9CA3AF"}>
                          {o.isActive ? "Active" : "Paused"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6B7280]">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setModal({ open: true, editing: o })}>
                        <Pencil size={14} /> Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? "Edit Offer" : "Create Offer"}
        description="Configure advertiser payout and AppsFlyer tracking."
      >
        <OfferForm
          defaultValues={
            modal.editing
              ? {
                  name: modal.editing.name,
                  type: modal.editing.type as OfferFormValues["type"],
                  payoutValue: modal.editing.payoutValue,
                  payoutCurrency: modal.editing.payoutCurrency,
                  appsflyerAppId: modal.editing.appsflyerAppId,
                  advertiserEmail: modal.editing.advertiserEmail || "",
                  isActive: modal.editing.isActive,
                }
              : undefined
          }
          onSubmit={save}
          onCancel={() => setModal({ open: false, editing: null })}
        />
      </Modal>
    </div>
  );
}
