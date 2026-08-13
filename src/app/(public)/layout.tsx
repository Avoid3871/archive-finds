import { PublicHeader } from "@/components/navigation/PublicHeader";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Footer } from "@/components/navigation/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-grow">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
}
