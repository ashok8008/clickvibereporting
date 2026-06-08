import { getReportData } from "@/lib/reporting";
import { getFilterOptions } from "@/lib/filter-options";
import { ReportingView } from "@/components/admin/ReportingView";

export const dynamic = "force-dynamic";

export default async function AdminReportingPage() {
  const [data, filterOptions] = await Promise.all([getReportData({}), getFilterOptions()]);
  return <ReportingView scope="admin" initialData={data} filterOptions={filterOptions} />;
}
