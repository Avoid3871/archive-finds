import { PublicHeader } from "@/components/navigation/PublicHeader";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Footer } from "@/components/navigation/Footer";
import { ContentProtectionShield } from "@/components/security/ContentProtectionShield";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white select-none">
      <ContentProtectionShield />
      <PublicHeader />
      <main className="flex-grow">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
}
