import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getSessionOrThrow() {
  const session = await getServerSession(authOptions);
  if (!session) throw new ApiError(401, "Unauthorized");
  return session;
}

export async function requireAdmin() {
  const session = await getSessionOrThrow();
  if (session.user.role !== "ADMIN") throw new ApiError(403, "Forbidden");
  return session;
}

export async function requirePublisher() {
  const session = await getSessionOrThrow();
  if (session.user.role !== "PUBLISHER") throw new ApiError(403, "Forbidden");
  return session;
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[api] error:", err);
  const message = err instanceof Error ? err.message : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}
