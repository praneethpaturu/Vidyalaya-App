import DeclarationEditor from "@/components/DeclarationEditor";

export default async function StaffTaxEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeclarationEditor staffId={id} />;
}
