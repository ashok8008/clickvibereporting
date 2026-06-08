import { dbConnect } from "@/lib/db";
import { Offer } from "@/models";
import { CsvUpload } from "@/components/admin/CsvUpload";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  await dbConnect();
  const offers = await Offer.find({ isActive: true }).sort({ name: 1 }).lean();
  return (
    <CsvUpload offers={offers.map((o) => ({ id: String(o._id), name: o.name }))} />
  );
}
