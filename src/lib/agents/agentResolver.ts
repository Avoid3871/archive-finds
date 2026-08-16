import { AGENTS_CONFIG, AgentId, AgentInfo } from "./agentConfig";

/**
 * Extracts raw marketplace link (Weidian, Taobao, Tmall, 1688) from an affiliate or raw URL.
 */
export function extractRawMarketUrl(url: string): string {
  if (!url) return "";
  try {
    // If it's already a Sugargoo link with productLink query param
    if (url.includes("sugargoo.com") && url.includes("productLink=")) {
      const parsed = new URL(url);
      const productLink = parsed.searchParams.get("productLink");
      if (productLink) {
        return decodeURIComponent(productLink);
      }
    }

    // If it's Superbuy / Mulebuy / CNfans with url query param
    if (url.includes("url=")) {
      const parsed = new URL(url);
      const target = parsed.searchParams.get("url");
      if (target) {
        return decodeURIComponent(target);
      }
    }

    return url;
  } catch (e) {
    return url;
  }
}

/**
 * Resolves an affiliate order link for any chosen agent given the product's market or affiliate URL.
 */
export function resolveAgentUrl(sourceUrl: string, agentId: AgentId = "sugargoo"): string {
  const rawUrl = extractRawMarketUrl(sourceUrl);
  if (!rawUrl) return sourceUrl;

  const agent = AGENTS_CONFIG[agentId] || AGENTS_CONFIG.sugargoo;
  return agent.affiliateUrlTemplate(rawUrl, agent.affiliateId);
}

/**
 * Returns the active default agent config.
 */
export function getDefaultAgent(): AgentInfo {
  return AGENTS_CONFIG.sugargoo;
}

/**
 * Returns all supported agents as an array.
 */
export function getAllAgents(): AgentInfo[] {
  return Object.values(AGENTS_CONFIG);
}
