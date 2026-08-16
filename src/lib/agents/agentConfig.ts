export type AgentId = 
  | "sugargoo"
  | "superbuy"
  | "mulebuy"
  | "cnfans"
  | "cssbuy"
  | "kakobuy"
  | "hoobuy";

export interface AgentInfo {
  id: AgentId;
  name: string;
  badge?: string;
  isDefault?: boolean;
  affiliateId: string; // Enter your affiliate code/ID here
  affiliateUrlTemplate: (marketUrl: string, affiliateId: string) => string;
  description: string;
  website: string;
  coupons?: string;
}

export const AGENTS_CONFIG: Record<AgentId, AgentInfo> = {
  sugargoo: {
    id: "sugargoo",
    name: "Sugargoo",
    badge: "RECOMMENDED",
    isDefault: true,
    affiliateId: "1325437696506389977", // Active Sugargoo Member ID
    coupons: "$140 Coupons",
    website: "https://www.sugargoo.com",
    description: "Fast processing, live QC photos, and discounted global shipping lines.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const aid = affiliateId || "1325437696506389977";
      return `https://www.sugargoo.com/products?productLink=${encodeURIComponent(cleanUrl)}&memberId=${aid}`;
    },
  },
  superbuy: {
    id: "superbuy",
    name: "Superbuy",
    badge: "POPULAR",
    affiliateId: "", // Add your Superbuy partner code here
    coupons: "$86 Coupons",
    website: "https://www.superbuy.com",
    description: "Established veteran agent with 24/7 customer support and extensive packaging options.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const code = affiliateId ? `&partnercode=${affiliateId}` : "";
      return `https://www.superbuy.com/en/page/buy/?url=${encodeURIComponent(cleanUrl)}${code}`;
    },
  },
  mulebuy: {
    id: "mulebuy",
    name: "Mulebuy",
    badge: "FAST QC",
    affiliateId: "", // Add your Mulebuy ref code here
    coupons: "$200 Coupons",
    website: "https://mulebuy.com",
    description: "Modern shopping platform with automated Weidian/Taobao order matching.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const ref = affiliateId ? `&ref=${affiliateId}` : "";
      return `https://mulebuy.com/product/?url=${encodeURIComponent(cleanUrl)}${ref}`;
    },
  },
  cnfans: {
    id: "cnfans",
    name: "CNfans",
    badge: "TRENDING",
    affiliateId: "", // Add your CNfans ref code here
    coupons: "$130 Coupons",
    website: "https://cnfans.com",
    description: "Community-favorite agent with automated order placement and HD QC inspection.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const ref = affiliateId ? `&ref=${affiliateId}` : "";
      return `https://cnfans.com/product/?url=${encodeURIComponent(cleanUrl)}${ref}`;
    },
  },
  cssbuy: {
    id: "cssbuy",
    name: "CSSbuy",
    affiliateId: "", // Add your CSSbuy promo code here
    coupons: "$50 Coupons",
    website: "https://www.cssbuy.com",
    description: "Long-standing agent platform with customizable shipping and insurance options.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const promo = affiliateId ? `&promo=${affiliateId}` : "";
      return `https://www.cssbuy.com/item.html?url=${encodeURIComponent(cleanUrl)}${promo}`;
    },
  },
  kakobuy: {
    id: "kakobuy",
    name: "Kakobuy",
    affiliateId: "",
    coupons: "$120 Coupons",
    website: "https://www.kakobuy.com",
    description: "Fast purchasing agent with dedicated warehouse inspection and package rehearsal.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const ref = affiliateId ? `&ref=${affiliateId}` : "";
      return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(cleanUrl)}${ref}`;
    },
  },
  hoobuy: {
    id: "hoobuy",
    name: "Hoobuy",
    affiliateId: "",
    coupons: "$100 Coupons",
    website: "https://hoobuy.com",
    description: "Streamlined agent checkout with multi-currency payment methods.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const ref = affiliateId ? `&ref=${affiliateId}` : "";
      return `https://hoobuy.com/product?url=${encodeURIComponent(cleanUrl)}${ref}`;
    },
  },
};
