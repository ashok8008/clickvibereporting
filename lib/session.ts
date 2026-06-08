import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

export async function requireRole(role: "ADMIN" | "PUBLISHER") {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== role) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/publisher");
  }
  return session;
}
