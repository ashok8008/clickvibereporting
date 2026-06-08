import { requireRole } from "@/lib/session";
import { getReportData } from "@/lib/reporting";
import { getFilterOptions } from "@/lib/filter-options";
import { ReportingView } from "@/components/admin/ReportingView";
import { Card, CardBody } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PublisherReportingPage() {
  const session = await requireRole("PUBLISHER");
  const publisherId = session.user.publisherId;

  if (!publisherId) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-[#6B7280]">No publisher profile is linked to your account.</p>
        </CardBody>
      </Card>
    );
  }

  const [data, filterOptions] = await Promise.all([
    getReportData({ publisherId }),
    getFilterOptions(publisherId),
  ]);

  return <ReportingView scope="publisher" initialData={data} filterOptions={filterOptions} />;
}
