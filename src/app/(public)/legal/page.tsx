import { Metadata } from "next";
import Link from "next/link";
import { Scale, Mail, ShieldAlert, Globe, ArrowLeft, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal Notice & Imprint — Archive Finds",
  description: "International legal notice, trademark fair use statement, and editorial contact information.",
};

export default function LegalImprintPage() {
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
            <Scale className="w-3.5 h-3.5 text-black" />
            <span>Legal Disclosure</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            Legal Notice &amp; Imprint
          </h1>
          <p className="text-sm font-mono text-neutral-500 uppercase tracking-widest">
            International Information Notice &amp; Editorial Representation
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-neutral-800 leading-relaxed text-sm sm:text-base">
          {/* Section 1: Platform Operator & International Representation */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              1. Platform Operator &amp; Editorial Entity
            </h2>
            <p>
              This digital fashion directory and automated archival search engine is operated as an independent curation collective:
            </p>
            <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 font-mono text-xs text-neutral-800">
              <p className="font-bold text-sm text-black uppercase tracking-wider">
                ARCHIVE FINDS INTERNATIONAL CURATION COLLECTIVE
              </p>
              <p>Platform: <code>archive-finds.vercel.app</code></p>
              <p>Hosting &amp; Edge Infrastructure: Vercel Inc., San Francisco, CA, USA</p>
              <p>Primary Communication Channel: <code>contact@archive-finds.app</code></p>
            </div>
          </section>

          {/* Section 2: Contact & Support */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              2. Digital Inquiries &amp; Support
            </h2>
            <p>
              For general questions, product indexing requests, or dead-link reports, please reach out via our official electronic contact channels:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-100 border border-neutral-200 rounded-lg space-y-1">
                <span className="text-xs font-mono font-bold text-neutral-500 uppercase">General &amp; Partnership</span>
                <p className="font-mono text-sm font-bold text-black">contact@archive-finds.app</p>
              </div>
              <div className="p-4 bg-neutral-100 border border-neutral-200 rounded-lg space-y-1">
                <span className="text-xs font-mono font-bold text-neutral-500 uppercase">Legal &amp; Takedown Notices</span>
                <p className="font-mono text-sm font-bold text-black">legal@archive-finds.app</p>
              </div>
            </div>
          </section>

          {/* Section 3: Nominative Fair Use & Trademark Rights */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              3. Trademark Disclaimer &amp; Nominative Fair Use
            </h2>
            <p>
              Archive Finds is not affiliated with, sponsored by, or endorsed by any of the fashion houses, luxury designers, or brand entities mentioned on this site.
            </p>
            <p>
              All trademarks, service marks, trade names, trade dress, product names, and logos appearing on the site are the property of their respective owners. Any reference to specific designers (e.g. Rick Owens, Undercover, Chrome Hearts, Maison Margiela, Enfants Riches Déprimés, Balenciaga, Raf Simons) is strictly for nominative identification, fashion historical education, and index categorization.
            </p>
          </section>

          {/* Section 4: Copyright Infringement & DMCA Notice Procedure */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              4. Notice and Takedown Procedure (DMCA / EU E-Commerce)
            </h2>
            <p>
              Archive Finds respects intellectual property rights. If you are a copyright holder or an authorized agent and believe that content indexed on this platform infringes upon your rights, please submit a written takedown notice containing:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-neutral-700 font-mono text-xs">
              <li>Identification of the copyrighted work or trademark claimed to be infringed.</li>
              <li>The exact URL(s) on Archive Finds where the material is located.</li>
              <li>Your contact information (name, address, telephone number, and email).</li>
              <li>A statement confirming good faith belief that the disputed use is unauthorized.</li>
            </ol>
            <p className="pt-2">
              Valid takedown notices sent to <code>legal@archive-finds.app</code> will be reviewed and processed within 24–48 business hours.
            </p>
          </section>

          {/* Section 5: Online Dispute Resolution */}
          <section className="space-y-3 pt-6 border-t border-neutral-200">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              5. Dispute Resolution
            </h2>
            <p className="text-xs text-neutral-600">
              The European Commission provides a platform for online dispute resolution (ODR): <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="underline font-mono text-black">https://ec.europa.eu/consumers/odr</a>. We are neither obligated nor willing to participate in dispute resolution proceedings before a consumer arbitration board.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
