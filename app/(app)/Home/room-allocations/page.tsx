import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import HomePageTabs from "@/components/HomePageTabs";

export default async function RoomAllocationsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const allotments = await prisma.hostelAllotment.findMany({
    where: { schoolId: sId, status: "ACTIVE" },
    include: { building: true, bed: { include: { room: true } } },
    take: 100,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <HomePageTabs />
      <h1 className="h-page text-slate-700 mb-3">Room Allocations</h1>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Building</th><th>Room</th><th>Bed</th><th>Student ID</th><th>From</th><th>Rent</th></tr>
          </thead>
          <tbody>
            {allotments.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No Data Found</td></tr>
            )}
            {allotments.map((a) => (
              <tr key={a.id}>
                <td>{a.building.name}</td>
                <td>{a.bed.room.number}</td>
                <td>{a.bed.label}</td>
                <td className="font-mono text-xs">{a.studentId}</td>
                <td>{new Date(a.fromDate).toLocaleDateString("en-IN")}</td>
                <td>₹{(a.monthlyRent / 100).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-100">
          <Link href="/Home/Hostel" className="text-brand-700 hover:underline">Open Hostel module →</Link>
        </div>
      </div>
    </div>
  );
}
