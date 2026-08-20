import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, EyeOff, Server, Cookie, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy & GDPR Compliance — Archive Finds",
  description: "Privacy-first architecture. Zero tracking cookies, fully GDPR and CCPA compliant.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        {/* Back navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Catalog</span>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-4 border-b border-neutral-200 pb-8 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-mono uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Privacy-First Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm font-mono text-neutral-500 uppercase tracking-widest">
            Last Updated: August 2026 • Effective Worldwide
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-12 text-neutral-800 leading-relaxed text-sm sm:text-base">
          {/* Key Privacy Highlights Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-neutral-50 border border-neutral-200 rounded-xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-black">
                <Cookie className="w-4 h-4 text-emerald-600" />
                <span>Zero Cookies</span>
              </div>
              <p className="text-xs text-neutral-600">
                We do not use tracking or advertising cookies. No cookie banner is required.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-black">
                <EyeOff className="w-4 h-4 text-emerald-600" />
                <span>No Personal Data Sale</span>
              </div>
              <p className="text-xs text-neutral-600">
                We never sell, rent, or trade your personal data with third-party data brokers.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-black">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Local Storage</span>
              </div>
              <p className="text-xs text-neutral-600">
                Saved items and wishlist preferences remain exclusively inside your browser.
              </p>
            </div>
          </div>

          {/* Section 1: Overview */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              1. Overview &amp; Data Philosophy
            </h2>
            <p>
              Archive Finds (<em>&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;</em>) is an independent high-fashion archive curation platform and visual directory. We respect the privacy of every visitor and believe that modern digital experiences must protect user identity by default.
            </p>
            <p>
              This Privacy Policy explains how we handle minimal technical information when you access <strong>archive-finds.vercel.app</strong> and its related services.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              2. Information We Process
            </h2>
            <p>
              We adhere to strict data minimization principles under the General Data Protection Regulation (GDPR / DSGVO Art. 5) and the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-neutral-700">
              <li>
                <strong>Anonymized Technical Metrics:</strong> Browser type, operating system, generic device class (e.g. mobile vs. desktop), referring URLs (e.g. TikTok, Instagram), and requested page routes.
              </li>
              <li>
                <strong>Anonymized IP Address Processing:</strong> IP addresses are truncated/hashed at the network edge and are never stored in readable format or linked to individuals.
              </li>
              <li>
                <strong>Client-Side Local Storage:</strong> Your Saved / Wishlist garments and currency preference (USD, EUR, GBP, JPY, CNY) are saved directly in your browser&apos;s <code>localStorage</code>. This data never touches our server database.
              </li>
            </ul>
          </section>

          {/* Section 3: Web Analytics & Zero Cookies */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              3. Web Analytics (Cookie-Free &amp; Privacy-Compliant)
            </h2>
            <p>
              We utilize privacy-first analytics provided by Vercel Analytics and our internal serverless beacon engine. Unlike traditional analytics trackers (e.g. Google Analytics or Facebook Pixel):
            </p>
            <div className="p-4 bg-neutral-100 border border-neutral-200 space-y-2 font-mono text-xs">
              <p>✓ <strong>No cookies</strong> are written to your computer or mobile device.</p>
              <p>✓ <strong>No cross-site profiling</strong> or advertising retargeting takes place.</p>
              <p>✓ <strong>No personal identifiers</strong> are stored or queried.</p>
            </div>
          </section>

          {/* Section 4: Outbound Affiliate Links */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              4. Third-Party Marketplace &amp; Agent Links
            </h2>
            <p>
              When you click on &quot;View Item&quot; or select a shopping agent (such as Sugargoo, Superbuy, Mulebuy, CNfans, CSSbuy, Kakobuy, or Hoobuy), you are redirected to third-party platforms. Those external websites operate under their own distinct privacy policies and terms of service. We do not transmit any personal user data to those agents.
            </p>
          </section>

          {/* Section 5: User Rights under GDPR & CCPA */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              5. Your Data Rights
            </h2>
            <p>
              Under European (GDPR/DSGVO) and international privacy laws, you possess the following rights regarding any data:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-neutral-700">
              <li>The right to access information processed about you (Art. 15 GDPR).</li>
              <li>The right to rectification or erasure of personal data (Art. 16, 17 GDPR).</li>
              <li>The right to restrict or object to data processing (Art. 18, 21 GDPR).</li>
            </ul>
            <p className="pt-2">
              Because we do not collect names, emails, or personal accounts, clearing your browser&apos;s local storage will permanently purge any local wishlist state.
            </p>
          </section>

          {/* Section 6: Contact & Inquiries */}
          <section className="space-y-3 pt-6 border-t border-neutral-200">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              6. Privacy Contact &amp; Inquiries
            </h2>
            <p>
              If you have any questions, inquiries, or feedback regarding our privacy practices, you can contact our editorial collective at:
            </p>
            <p className="font-mono text-xs bg-neutral-100 p-4 border border-neutral-200 inline-block">
              <strong>Archive Finds Curation Collective</strong><br />
              Email: <code>contact@archive-finds.app</code><br />
              Digital Inquiry Portal: <code>https://archive-finds.vercel.app/legal</code>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
