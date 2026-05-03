import { headers } from "next/headers";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import QRPrintClient from "./QRPrintClient";

export const dynamic = "force-dynamic";

export default async function AdmissionQRPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const school = await prisma.school.findUnique({ where: { id: u.schoolId } });
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;
  const onlineUrl = `${baseUrl}/enquire/${school?.code ?? ""}`;
  const walkinUrl = `${baseUrl}/enquire/${school?.code ?? ""}?source=WALKIN`;

  return (
    <QRPrintClient
      schoolName={school?.name ?? ""}
      schoolCity={`${school?.city ?? ""}, ${school?.state ?? ""}`}
      onlineUrl={onlineUrl}
      walkinUrl={walkinUrl}
    />
  );
}
