"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PublisherForm } from "./PublisherForm";
import { formatDate } from "@/lib/utils";

export interface PublisherRow {
  _id: string;
  name: string;
  email: string;
  siteCount: number;
  offerCount: number;
  createdAt: string;
}

export function PublishersClient({ initialPublishers }: { initialPublishers: PublisherRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Publishers</h2>
          <p className="text-sm text-[#6B7280]">{initialPublishers.length} partners onboarded</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> New Publisher
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>All Publishers</CardTitle>
        </CardHeader>
        <div className="cv-scroll overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr>
                {["Publisher", "Email", "Sites", "Offers", "Created", ""].map((h) => (
                  <th key={h} className="border-b border-cardborder bg-[#F8F9FF] px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initialPublishers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-[#9CA3AF]">
                    No publishers yet. Onboard your first partner.
                  </td>
                </tr>
              ) : (
                initialPublishers.map((p) => (
                  <tr key={p._id} className="border-b border-[#F3F4F6] hover:bg-[#F8F9FF]">
                    <td className="px-4 py-3 text-sm font-bold text-navy">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-[#6B7280]">{p.email}</td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{p.siteCount}</td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{p.offerCount}</td>
                    <td className="px-4 py-3 text-sm text-[#6B7280]">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/publishers/${p._id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-indigo hover:underline"
                      >
                        View <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Onboard Publisher"
        description="Create login credentials and add media sites."
      >
        <PublisherForm onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
