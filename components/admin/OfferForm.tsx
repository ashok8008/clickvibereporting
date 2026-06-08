"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CPA", "CPI", "CPL", "REVSHARE"]),
  payoutValue: z.coerce.number().min(0, "Payout must be ≥ 0"),
  payoutCurrency: z.string().min(1),
  appsflyerAppId: z.string().min(1, "AppsFlyer App ID is required"),
  advertiserEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type OfferFormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<OfferFormValues>;
  onSubmit: (values: OfferFormValues) => Promise<void>;
  onCancel: () => void;
}

export function OfferForm({ defaultValues, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "CPA",
      payoutValue: 0,
      payoutCurrency: "USD",
      appsflyerAppId: "",
      advertiserEmail: "",
      isActive: true,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Offer Name</Label>
        <Input placeholder="Polymarket iOS" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-[#EF4444]">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Offer Type</Label>
          <Select {...register("type")}>
            <option value="CPA">CPA — Cost per acquisition</option>
            <option value="CPI">CPI — Cost per install</option>
            <option value="CPL">CPL — Cost per lead</option>
            <option value="REVSHARE">RevShare</option>
          </Select>
        </div>
        <div>
          <Label>Currency</Label>
          <Input {...register("payoutCurrency")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Payout Value</Label>
          <Input type="number" step="0.01" {...register("payoutValue")} />
          {errors.payoutValue && <p className="mt-1 text-xs text-[#EF4444]">{errors.payoutValue.message}</p>}
        </div>
        <div>
          <Label>AppsFlyer App ID</Label>
          <Input placeholder="id6648798962" {...register("appsflyerAppId")} />
          {errors.appsflyerAppId && <p className="mt-1 text-xs text-[#EF4444]">{errors.appsflyerAppId.message}</p>}
        </div>
      </div>

      <div>
        <Label>Advertiser Email (optional)</Label>
        <Input placeholder="legate@polymarket.com" {...register("advertiserEmail")} />
        {errors.advertiserEmail && <p className="mt-1 text-xs text-[#EF4444]">{errors.advertiserEmail.message}</p>}
      </div>

      <label className="flex items-center gap-2.5 rounded-lg bg-[#F8F9FF] px-3 py-2.5">
        <input type="checkbox" {...register("isActive")} className="h-4 w-4 accent-indigo" />
        <span className="text-sm font-medium text-navy">Offer is active</span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save Offer"}
        </Button>
      </div>
    </form>
  );
}
