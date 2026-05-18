import MenuClient from "./menu-client";

export default async function MenuPage({ params }: { params: Promise<{ qrCode: string }> }) {
  const resolvedParams = await params;
  return <MenuClient qrCode={resolvedParams.qrCode} />;
}
