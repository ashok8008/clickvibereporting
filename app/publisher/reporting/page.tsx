import { requireRole } from "@/lib/session";
import { getReportData } from "@/lib/reporting";
import { getFilterOptions } from "@/lib/filter-options";
import { getDateRangeForPreset } from "@/lib/date-ranges";
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

  const defaultRange = getDateRangeForPreset("last7");
  const [data, filterOptions] = await Promise.all([
    getReportData({ publisherId, from: defaultRange.from, to: defaultRange.to }),
    getFilterOptions(publisherId),
  ]);

  return <ReportingView scope="publisher" initialData={data} filterOptions={filterOptions} defaultPreset="last7" />;
}
