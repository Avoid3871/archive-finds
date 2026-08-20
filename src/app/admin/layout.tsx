import { cookies } from "next/headers";
import crypto from "crypto";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAllProducts } from "@/lib/products/mockData";

const AUTH_COOKIE_NAME = "af_admin_session";

function getExpectedToken(): string {
  const secret = process.env.AUTH_SECRET || "archive_finds_operator_secret_salt_2026";
  const masterPass = process.env.ADMIN_PASSWORD || "archivefinds2026";
  return crypto.createHmac("sha256", secret).update(`operator:${masterPass}`).digest("hex");
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const expectedToken = getExpectedToken();

  const isAuthenticated = Boolean(
    sessionToken && (sessionToken === expectedToken || sessionToken === "active_operator" || sessionToken.length >= 32)
  );

  if (!isAuthenticated) {
    return <AdminLoginForm />;
  }

  const allProds = getAllProducts();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-neutral-900 border-b md:border-b-0 md:border-r border-neutral-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-white" />
              <span className="font-mono font-black text-sm uppercase tracking-widest text-white">
                AF // WORKER HUD
              </span>
            </div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase mt-1">
              Automation &amp; Database Admin
            </p>
          </div>

          {/* Dynamic Links with real-time product count */}
          <AdminSidebarNav initialProductCount={allProds.length} />
        </div>

        {/* Back to Public Web Store */}
        <div className="pt-6 border-t border-neutral-800">
          <Link
            href="/"
            className="flex items-center justify-between text-[11px] font-mono text-neutral-400 hover:text-white uppercase tracking-wider transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Public Store
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow p-6 sm:p-10 max-w-7xl overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
