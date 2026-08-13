import Link from "next/link";
import { ArrowLeft, LayoutDashboard, Layers, FileSpreadsheet, Activity, Settings, ExternalLink, Smartphone } from "lucide-react";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              Automation & Database Admin
            </p>
          </div>

          {/* Links */}
          <nav className="space-y-1 text-xs font-mono uppercase tracking-wider">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center gap-2.5 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>Products (95)</span>
            </Link>
            <Link
              href="/admin/slides"
              className="flex items-center gap-2.5 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>9:16 Slide Studio</span>
            </Link>
            <Link
              href="/admin/sources"
              className="flex items-center gap-2.5 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Sheet Sources</span>
            </Link>
            <Link
              href="/admin/jobs"
              className="flex items-center gap-2.5 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span>Job Queue</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-2.5 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </nav>
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
