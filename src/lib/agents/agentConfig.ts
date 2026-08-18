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
    affiliateId: "wVam6e", // Active Superbuy Partner Code
    coupons: "$86 Coupons",
    website: "https://www.superbuy.com",
    description: "Established veteran agent with 24/7 customer support and extensive packaging options.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const code = affiliateId || "wVam6e";
      return `https://www.superbuy.com/en/page/buy/?url=${encodeURIComponent(cleanUrl)}&partnercode=${code}`;
    },
  },
  mulebuy: {
    id: "mulebuy",
    name: "Mulebuy",
    badge: "FAST QC",
    affiliateId: "201493429", // Active Mulebuy Ref Code
    coupons: "$200 Coupons",
    website: "https://mulebuy.com",
    description: "Modern shopping platform with automated Weidian/Taobao order matching.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const ref = affiliateId || "201493429";
      return `https://mulebuy.com/product/?url=${encodeURIComponent(cleanUrl)}&ref=${ref}`;
    },
  },
  cnfans: {
    id: "cnfans",
    name: "CNfans",
    badge: "TRENDING",
    affiliateId: "16313214", // Active CNfans Ref Code
    coupons: "$130 Coupons",
    website: "https://cnfans.com",
    description: "Community-favorite agent with automated order placement and HD QC inspection.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const ref = affiliateId || "16313214";
      return `https://cnfans.com/product/?url=${encodeURIComponent(cleanUrl)}&ref=${ref}`;
    },
  },
  cssbuy: {
    id: "cssbuy",
    name: "CSSbuy",
    badge: "ESTABLISHED",
    affiliateId: "8e51fa03f5b9b13a", // Active CSSbuy Promotion Code
    coupons: "$50 Coupons",
    website: "https://www.cssbuy.com",
    description: "Long-standing agent platform with customizable shipping and insurance options.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const promo = affiliateId || "8e51fa03f5b9b13a";
      return `https://www.cssbuy.com/item.html?url=${encodeURIComponent(cleanUrl)}&promotionCode=${promo}&inviter=z3r0x`;
    },
  },
  kakobuy: {
    id: "kakobuy",
    name: "Kakobuy",
    badge: "FAST SHIPPING",
    affiliateId: "ut9mq", // Active Kakobuy Affcode
    coupons: "$120 Coupons",
    website: "https://www.kakobuy.com",
    description: "Fast purchasing agent with dedicated warehouse inspection and package rehearsal.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const aff = affiliateId || "ut9mq";
      return `https://www.kakobuy.com/item/details?url=${encodeURIComponent(cleanUrl)}&affcode=${aff}`;
    },
  },
  hoobuy: {
    id: "hoobuy",
    name: "Hoobuy",
    badge: "PROMO",
    affiliateId: "PR3YGPpE", // Active Hoobuy Invite Code
    coupons: "$135 Coupons",
    website: "https://hoobuy.com",
    description: "Streamlined agent checkout with multi-currency payment methods and freight vouchers.",
    affiliateUrlTemplate: (marketUrl, affiliateId) => {
      const cleanUrl = marketUrl.trim();
      const code = affiliateId || "PR3YGPpE";
      return `https://hoobuy.com/product?url=${encodeURIComponent(cleanUrl)}&inviteCode=${code}&utm_source=website&utm_medium=ambassador`;
    },
  },
};

export function generateAgentUrl(agentId: AgentId, marketUrl: string, customAffiliateId?: string): string {
  const agent = AGENTS_CONFIG[agentId] || AGENTS_CONFIG.sugargoo;
  const affiliateId = customAffiliateId || agent.affiliateId;
  return agent.affiliateUrlTemplate(marketUrl, affiliateId);
}

export function getAllAgents(): AgentInfo[] {
  return Object.values(AGENTS_CONFIG);
}

export function getDefaultAgent(): AgentInfo {
  return AGENTS_CONFIG.sugargoo;
}
