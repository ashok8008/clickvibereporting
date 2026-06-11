import { getReportData } from "@/lib/reporting";
import { getFilterOptions } from "@/lib/filter-options";
import { getDateRangeForPreset } from "@/lib/date-ranges";
import { ReportingView } from "@/components/admin/ReportingView";

export const dynamic = "force-dynamic";

export default async function AdminReportingPage() {
  const defaultRange = getDateRangeForPreset("last7");
  const [data, filterOptions] = await Promise.all([
    getReportData({ from: defaultRange.from, to: defaultRange.to }),
    getFilterOptions(),
  ]);
  return <ReportingView scope="admin" initialData={data} filterOptions={filterOptions} defaultPreset="last7" />;
}
