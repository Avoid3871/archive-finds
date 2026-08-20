import { Metadata } from "next";
import Link from "next/link";
import { FileText, AlertCircle, ExternalLink, ArrowLeft, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — Archive Finds",
  description: "Terms and conditions governing the use of the Archive Finds curation directory.",
};

export default function TermsOfServicePage() {
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
            <FileText className="w-3.5 h-3.5 text-black" />
            <span>Platform Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm font-mono text-neutral-500 uppercase tracking-widest">
            Effective Date: August 2026 • Universal Agreement
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-neutral-800 leading-relaxed text-sm sm:text-base">
          {/* Important Notice Box */}
          <div className="p-6 bg-neutral-900 text-white rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>Important Curation &amp; Non-Seller Notice</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Archive Finds is an independent informational search engine, discovery directory, and digital editorial archive. <strong>We do not manufacture, warehouse, stock, sell, or ship any physical garments or products.</strong> All purchases are conducted on independent third-party platforms.
            </p>
          </div>

          {/* Section 1: Acceptance of Terms */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or utilizing <strong>archive-finds.vercel.app</strong> (the <em>&quot;Site&quot;</em> or <em>&quot;Service&quot;</em>), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree with any part of these terms, please discontinue use of the platform.
            </p>
          </section>

          {/* Section 2: Platform Purpose & Nature */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              2. Nature of the Service
            </h2>
            <p>
              Archive Finds acts exclusively as a search index, visual lookbook, and community curation tool for archival fashion enthusiasts. Our platform provides:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-neutral-700">
              <li>Editorial categorization and image aggregation of runway pieces.</li>
              <li>Estimated market procuring pricing and historical reference values.</li>
              <li>Outbound navigation routing to verified international shopping agents (Sugargoo, Superbuy, Mulebuy, CNfans, CSSbuy, Kakobuy, Hoobuy).</li>
            </ul>
          </section>

          {/* Section 3: Third-Party Merchants & Agent Transactions */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              3. Independent Agents &amp; Marketplaces
            </h2>
            <p>
              Any transaction, payment, quality-control inspection, customs clearance, shipping, or return request is strictly between you and the respective third-party agent or marketplace (e.g. Weidian, Taobao, 1688, Sugargoo).
            </p>
            <div className="p-4 bg-neutral-50 border border-neutral-200 font-mono text-xs text-neutral-700 space-y-1.5">
              <p>• Archive Finds does not handle or store payment information.</p>
              <p>• Archive Finds does not guarantee inventory availability or merchant fulfillment.</p>
              <p>• All customer service inquiries regarding shipping must be directed to your chosen agent.</p>
            </div>
          </section>

          {/* Section 4: Affiliate Disclosure */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              4. Affiliate Disclosure &amp; Transparency
            </h2>
            <p>
              In compliance with international advertising standards and FTC guidelines: Some outbound links on this Site are affiliate referral links. If you register or complete an order via these links, Archive Finds may receive a modest referral commission or shipping credit at <strong>zero additional cost to you</strong>. These commissions directly fund our automated scraper infrastructure, studio image cutout servers, and database maintenance.
            </p>
          </section>

          {/* Section 5: Intellectual Property & Trademarks */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              5. Trademarks &amp; Fair Use
            </h2>
            <p>
              All product names, logos, designer titles, brand names, and trademarks featured or referred to within the Archive Finds directory are the property of their respective trademark holders. Reference to any brand (such as Rick Owens, Maison Margiela, Raf Simons, Undercover, Balenciaga, ERD, etc.) is made purely for historical identification, educational cataloging, and nominative fair use.
            </p>
          </section>

          {/* Section 6: Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              6. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by applicable law, Archive Finds and its contributors shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use of, or inability to use, this directory or any third-party links accessed through it.
            </p>
          </section>

          {/* Section 7: Contact */}
          <section className="space-y-3 pt-6 border-t border-neutral-200">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black font-mono">
              7. Inquiries &amp; Legal Notices
            </h2>
            <p>
              For formal legal communications, trademark questions, or general platform inquiries:
            </p>
            <p className="font-mono text-xs bg-neutral-100 p-4 border border-neutral-200 inline-block">
              <strong>Archive Finds Legal &amp; Curation Operations</strong><br />
              Email: <code>legal@archive-finds.app</code><br />
              Website: <code>https://archive-finds.vercel.app</code>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
