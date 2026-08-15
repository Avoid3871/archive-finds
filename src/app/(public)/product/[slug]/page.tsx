import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getAllProducts } from "@/lib/products/mockData";
import { formatPrice } from "@/lib/utils";
import { AffiliateButton } from "@/components/products/AffiliateButton";
import { SavePieceButton } from "@/components/products/SavePieceButton";
import { ProductCard } from "@/components/products/ProductCard";
import { ArrowLeft, ShieldCheck, Truck, RefreshCw, Sparkles, ExternalLink } from "lucide-react";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export async function generateStaticParams() {
  const products = getAllProducts();
  return products.map((prod) => ({
    slug: prod.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: `${product.brand} - ${product.name} | ARCHIVE FINDS`,
    description: product.description,
    openGraph: {
      title: `${product.brand} - ${product.name}`,
      description: product.description,
      images: [
        {
          url: product.imageUrl,
          width: 1080,
          height: 1440,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const allProducts = getAllProducts();
  const relatedProducts = allProducts.filter(
    (p) => p.id !== product.id && (p.brandSlug === product.brandSlug || p.categorySlug === product.categorySlug)
  ).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-12">

      {/* Back breadcrumb */}
      <div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600 hover:text-black uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO DISCOVER</span>
        </Link>
      </div>

      {/* Main Product Showcase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Col: High-Res Image Display */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[3/4] w-full bg-neutral-50 border border-neutral-200 overflow-hidden">
            <Image
              src={product.imageUrl || "/placeholder-fashion.svg"}
              alt={`${product.brand} - ${product.name}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-contain p-6"
            />
            {product.isRare && (
              <div className="absolute top-4 left-4">
                <span className="px-2.5 py-1 bg-black text-white text-[10px] font-mono tracking-widest uppercase font-bold">
                  RARE ARCHIVE
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Editorial Details & Conversion Engine */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            {/* Brand & Title */}
            <div>
              <Link
                href={`/discover?brand=${product.brandSlug}`}
                className="text-xs font-black tracking-widest uppercase text-neutral-600 hover:text-black transition-colors"
              >
                {product.brand}
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price Tag */}
            <div className="flex items-baseline gap-3 pb-4 border-b border-neutral-200">
              <span className="text-2xl sm:text-3xl font-mono font-black text-black">
                {formatPrice(product.price, product.currency)}
              </span>
              <span className="text-xs font-mono text-neutral-600 uppercase">
                ESTIMATED PROCURING PRICE
              </span>
            </div>

            {/* Primary Action Button (Desktop/Tablet) */}
            <div className="space-y-3 pt-2">
              <AffiliateButton
                affiliateUrl={product.affiliateUrl}
                productId={product.id}
                productName={product.name}
                brand={product.brand}
                category={product.category}
                price={product.price}
                currency={product.currency}
                source="product_detail_main"
              />
              <SavePieceButton product={product} />
              <p className="text-[11px] font-mono text-neutral-600 text-center uppercase tracking-wider">
                Direct procurement via Sugargoo Agent
              </p>
            </div>

            {/* Editorial Description */}
            <div className="space-y-2 pt-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-600">
                Piece Editorial
              </h3>
              <p className="text-sm text-neutral-700 font-light leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Taxonomy & Specifications */}
            <div className="pt-4 border-t border-neutral-200 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-600">
                Specifications
              </h3>
              <dl className="grid grid-cols-2 gap-y-2 text-xs font-mono">
                <dt className="text-neutral-600 uppercase">Designer House:</dt>
                <dd className="text-black font-semibold uppercase">{product.brand}</dd>

                <dt className="text-neutral-600 uppercase">Category:</dt>
                <dd className="text-black uppercase">{product.category}</dd>

                <dt className="text-neutral-600 uppercase">Era:</dt>
                <dd className="text-black uppercase">{product.era}</dd>

                <dt className="text-neutral-600 uppercase">Aesthetic:</dt>
                <dd className="text-black uppercase">{product.style}</dd>
              </dl>
            </div>

            {/* Tags Cloud */}
            <div className="pt-2 flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-[10px] font-mono uppercase tracking-wider text-neutral-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Value Assurance Badges */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-2 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-black shrink-0" />
              <span>Verified Sugargoo agent order link</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-black shrink-0" />
              <span>Automated archive link integrity checks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Conversion Bar */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3 shadow-lg flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-neutral-600 uppercase truncate max-w-[140px]">
            {product.brand}
          </p>
          <p className="text-base font-black font-mono text-black">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
        <div className="flex-grow max-w-[220px]">
          <AffiliateButton
            affiliateUrl={product.affiliateUrl}
            productId={product.id}
            productName={product.name}
            brand={product.brand}
            category={product.category}
            price={product.price}
            currency={product.currency}
            source="product_detail_mobile_bar"
            className="py-2.5 px-4 text-xs"
          />
        </div>
      </div>

      {/* Related Archive Pieces */}
      {relatedProducts.length > 0 && (
        <section className="pt-16 border-t border-neutral-200 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-600">
                RELATED ARCHIVES
              </p>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                MORE FROM {product.brand.toUpperCase()} & {product.category.toUpperCase()}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
