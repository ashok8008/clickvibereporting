import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { User } from "@/models";
import { requirePublisher, handleApiError, ApiError } from "@/lib/api-auth";

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requirePublisher();
    const body = schema.parse(await req.json());
    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) throw new ApiError(404, "User not found");

    const valid = await bcrypt.compare(body.currentPassword, user.password);
    if (!valid) throw new ApiError(400, "Current password is incorrect");

    user.password = await bcrypt.hash(body.newPassword, 10);
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
