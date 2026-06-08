import { dbConnect } from "@/lib/db";
import { AppsflyerSync, Offer } from "@/models";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SyncNowButton } from "@/components/admin/SyncNowButton";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AppsflyerPage() {
  await dbConnect();
  const [syncs, offers] = await Promise.all([
    AppsflyerSync.find().sort({ syncedAt: -1 }).limit(50).lean(),
    Offer.find().lean(),
  ]);
  const offerMap = new Map(offers.map((o) => [String(o._id), o.name]));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">AppsFlyer Sync</h2>
          <p className="text-sm text-[#6B7280]">
            Pulls install data daily at 06:00 UTC. Trigger a manual sync any time.
          </p>
        </div>
        <SyncNowButton />
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <span className="text-xs font-medium text-[#888]">{syncs.length} runs</span>
        </CardHeader>
        <div className="cv-scroll overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                {["Date", "Offer", "Records", "Status", "Error"].map((h) => (
                  <th key={h} className="border-b border-cardborder bg-[#F8F9FF] px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {syncs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-[#9CA3AF]">
                    No syncs run yet. Click “Sync Now” to pull yesterday’s installs.
                  </td>
                </tr>
              ) : (
                syncs.map((s) => (
                  <tr key={String(s._id)} className="border-b border-[#F3F4F6] hover:bg-[#F8F9FF]">
                    <td className="px-4 py-3 text-sm text-[#374151]">{formatDate(s.syncedAt)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-navy">
                      {offerMap.get(String(s.offerId)) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#374151]">{s.recordCount}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge color={s.status === "success" ? "#22C55E" : "#EF4444"}>{s.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9CA3AF]">{s.error ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
