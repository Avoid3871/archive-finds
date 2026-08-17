export interface BrandDefinition {
  name: string;
  slug: string;
  era: string;
  origin: string;
  aliases?: string[];
  description?: string;
}

export const ARCHIVE_BRANDS: BrandDefinition[] = [
  { name: "Acne Studios", slug: "acne-studios", era: "1996–Present", origin: "Stockholm, Sweden", aliases: ["acne", "acnestudios", "1981m", "1989"] },
  { name: "Alexander McQueen", slug: "alexander-mcqueen", era: "1992–Present", origin: "London, UK", aliases: ["mcqueen"] },
  { name: "Amiri", slug: "amiri", era: "2014–Present", origin: "Los Angeles", aliases: ["mike amiri"] },
  { name: "Ann Demeulemeester", slug: "ann-demeulemeester", era: "1985–Present", origin: "Antwerp, Belgium", aliases: ["ann d", "demeulemeester"] },
  { name: "Arc'teryx", slug: "arcteryx", era: "1989–Present", origin: "Vancouver, Canada", aliases: ["arcteryx", "system_a", "veilance"] },
  { name: "Archive Selection", slug: "archive-selection", era: "Curated", origin: "Collector Archives", aliases: ["archive", "grail"] },
  { name: "Balenciaga", slug: "balenciaga", era: "1917–Present", origin: "Paris / Spain", aliases: ["blcg", "balenci"] },
  { name: "Balmain", slug: "balmain", era: "1945–Present", origin: "Paris, France" },
  { name: "Bape", slug: "bape", era: "1993–Present", origin: "Harajuku, Japan", aliases: ["a bathing ape", "bapesta"] },
  { name: "Boris Bidjan Saberi", slug: "boris-bidjan-saberi", era: "2007–Present", origin: "Barcelona / Germany", aliases: ["bbs", "11 by bbs"] },
  { name: "Bottega Veneta", slug: "bottega-veneta", era: "1966–Present", origin: "Vicenza, Italy", aliases: ["bottega", "bv"] },
  { name: "Burberry", slug: "burberry", era: "1856–Present", origin: "London, UK" },
  { name: "C.P. Company", slug: "cp-company", era: "1971–Present", origin: "Bologna, Italy", aliases: ["cp company", "cp"] },
  { name: "Carol Christian Poell", slug: "carol-christian-poell", era: "1995–Present", origin: "Austria / Milan", aliases: ["ccp", "poell"] },
  { name: "Casablanca", slug: "casablanca", era: "2018–Present", origin: "Paris, France" },
  { name: "Cav Empt", slug: "cav-empt", era: "2011–Present", origin: "Tokyo, Japan", aliases: ["ce", "c.e"] },
  { name: "Celine", slug: "celine", era: "1945–Present", origin: "Paris, France", aliases: ["cel", "céline"] },
  { name: "Chrome Hearts", slug: "chrome-hearts", era: "1988–Present", origin: "Los Angeles", aliases: ["ch", "chrome"] },
  { name: "Comme des Garçons", slug: "comme-des-garcons", era: "1969–Present", origin: "Tokyo, Japan", aliases: ["cdg", "comme des garcons", "comme", "cdg play", "homme plus"] },
  { name: "Craig Green", slug: "craig-green", era: "2012–Present", origin: "London, UK" },
  { name: "Deorart", slug: "deorart", era: "Archive", origin: "Harajuku, Japan" },
  { name: "Diesel", slug: "diesel", era: "1978–Present", origin: "Breganze, Italy", aliases: ["diesel 1dr", "glenn martens"] },
  { name: "Dior Homme", slug: "dior-homme", era: "1946–Present", origin: "Paris, France", aliases: ["dior", "hedi slimane dior", "kris van assche"] },
  { name: "Dirk Bikkembergs", slug: "dirk-bikkembergs", era: "1986–Present", origin: "Antwerp, Belgium", aliases: ["bikkembergs"] },
  { name: "Dries Van Noten", slug: "dries-van-noten", era: "1986–Present", origin: "Antwerp, Belgium", aliases: ["dries", "van noten"] },
  { name: "Elena Dawson", slug: "elena-dawson", era: "2006–Present", origin: "UK" },
  { name: "Enfants Riches Déprimés", slug: "erd", era: "2012–Present", origin: "Paris / LA", aliases: ["erd", "enfants riches deprimes", "enfants riches déprimés", "enfants"] },
  { name: "ERL", slug: "erl", era: "2018–Present", origin: "Venice Beach, CA", aliases: ["eli russell linnetz"] },
  { name: "Fear of God", slug: "fear-of-god", era: "2013–Present", origin: "Los Angeles", aliases: ["fog", "essentials"] },
  { name: "Gallery Dept", slug: "gallery-dept", era: "2017–Present", origin: "Los Angeles", aliases: ["gallery department", "josue thomas"] },
  { name: "Gaudy", slug: "gaudy", era: "Archive", origin: "Japan / Streetwear" },
  { name: "Givenchy", slug: "givenchy", era: "1952–Present", origin: "Paris, France", aliases: ["riccardo tisci givenchy"] },
  { name: "Gosha Rubchinskiy", slug: "gosha-rubchinskiy", era: "2008–Present", origin: "Moscow, Russia", aliases: ["gosha", "rassvet", "gr-uniforma"] },
  { name: "Grailz", slug: "grailz", era: "2020–Present", origin: "Seoul, South Korea" },
  { name: "Gucci", slug: "gucci", era: "1921–Present", origin: "Florence, Italy", aliases: ["tom ford gucci"] },
  { name: "Guidi", slug: "guidi", era: "1896–Present", origin: "Pescia, Italy", aliases: ["guidi 1896", "front zip boot"] },
  { name: "Haider Ackermann", slug: "haider-ackermann", era: "2001–Present", origin: "Paris / Antwerp", aliases: ["haider"] },
  { name: "Heliot Emil", slug: "heliot-emil", era: "2017–Present", origin: "Copenhagen, Denmark", aliases: ["heliot"] },
  { name: "Helmut Lang", slug: "helmut-lang", era: "1986–2005", origin: "Vienna / New York", aliases: ["helmut"] },
  { name: "Human Made", slug: "human-made", era: "2010–Present", origin: "Tokyo, Japan", aliases: ["nigo"] },
  { name: "Hyein Seo", slug: "hyein-seo", era: "2014–Present", origin: "Seoul, South Korea" },
  { name: "Hysteric Glamour", slug: "hysteric-glamour", era: "1984–Present", origin: "Tokyo, Japan", aliases: ["hysteric", "nobuhiko kitamura"] },
  { name: "Issey Miyake", slug: "issey-miyake", era: "1970–Present", origin: "Tokyo, Japan", aliases: ["issey", "homme plisse", "pleats please", "im"] },
  { name: "Jacquemus", slug: "jacquemus", era: "2009–Present", origin: "Paris, France" },
  { name: "Jean Paul Gaultier", slug: "jean-paul-gaultier", era: "1976–Present", origin: "Paris, France", aliases: ["jpg", "gaultier"] },
  { name: "Jil Sander", slug: "jil-sander", era: "1968–Present", origin: "Hamburg / Milan", aliases: ["jil", "luke and lucie meier"] },
  { name: "Julius", slug: "julius", era: "2001–Present", origin: "Tokyo, Japan", aliases: ["julius 7", "tatsuro horikawa"] },
  { name: "Junya Watanabe", slug: "junya-watanabe", era: "1992–Present", origin: "Tokyo, Japan", aliases: ["junya", "junya cdg", "watanabe"] },
  { name: "Juun.J", slug: "juun-j", era: "2007–Present", origin: "Seoul, South Korea", aliases: ["juunj", "juun j"] },
  { name: "Kapital", slug: "kapital", era: "1984–Present", origin: "Kojima, Japan", aliases: ["kapital kountry", "kountry", "hirata"] },
  { name: "Kiko Kostadinov", slug: "kiko-kostadinov", era: "2016–Present", origin: "London / Bulgaria", aliases: ["kiko", "kostadinov", "kiko asics"] },
  { name: "Lanvin", slug: "lanvin", era: "1889–Present", origin: "Paris, France", aliases: ["lanvin curb"] },
  { name: "Lemaire", slug: "lemaire", era: "1991–Present", origin: "Paris, France", aliases: ["christophe lemaire"] },
  { name: "Loewe", slug: "loewe", era: "1846–Present", origin: "Madrid, Spain", aliases: ["j.w. anderson loewe"] },
  { name: "Louis Vuitton", slug: "louis-vuitton", era: "1854–Present", origin: "Paris, France", aliases: ["lv", "virgil abloh lv"] },
  { name: "Maison Margiela", slug: "maison-margiela", era: "1988–Present", origin: "Paris / Brussels", aliases: ["margiela", "mm6", "martin margiela", "tabi"] },
  { name: "Maison Mihara Yasuhiro", slug: "maison-mihara-yasuhiro", era: "1997–Present", origin: "Tokyo, Japan", aliases: ["mihara yasuhiro", "mihara", "mmy"] },
  { name: "Marithé François Girbaud", slug: "marithe-francois-girbaud", era: "1972–Present", origin: "Paris, France", aliases: ["girbaud", "m+fg", "marithe"] },
  { name: "Martine Ali", slug: "martine-ali", era: "2010–Present", origin: "Brooklyn, NY" },
  { name: "Martine Rose", slug: "martine-rose", era: "2007–Present", origin: "London, UK" },
  { name: "Mastermind Japan", slug: "mastermind-japan", era: "1997–Present", origin: "Tokyo, Japan", aliases: ["mastermind", "mmj", "masaaki honma"] },
  { name: "Miu Miu", slug: "miu-miu", era: "1993–Present", origin: "Milan, Italy", aliases: ["miumiu"] },
  { name: "Moncler", slug: "moncler", era: "1952–Present", origin: "France / Italy", aliases: ["moncler genius"] },
  { name: "Needles", slug: "needles", era: "1997–Present", origin: "Tokyo, Japan", aliases: ["nepenthes needles", "keizo shimizu"] },
  { name: "Neighborhood", slug: "neighborhood", era: "1994–Present", origin: "Tokyo, Japan", aliases: ["nbhd", "shinsuke takizawa"] },
  { name: "No/Faith Studios", slug: "nofaithstudios", era: "2020–Present", origin: "Germany", aliases: ["no faith studios", "nofaithstudios", "nofaith"] },
  { name: "Number (N)ine", slug: "number-nine", era: "1997–2009", origin: "Tokyo, Japan", aliases: ["number nine", "n(n)", "nn", "takahiro miyashita"] },
  { name: "Off-White", slug: "off-white", era: "2012–Present", origin: "Milan, Italy", aliases: ["off white", "virgil abloh"] },
  { name: "Online Ceramics", slug: "online-ceramics", era: "2016–Present", origin: "Los Angeles", aliases: ["onlineceramics"] },
  { name: "Our Legacy", slug: "our-legacy", era: "2005–Present", origin: "Stockholm, Sweden", aliases: ["ourlegacy"] },
  { name: "Post Archive Faction (PAF)", slug: "post-archive-faction", era: "2018–Present", origin: "Seoul, South Korea", aliases: ["paf", "post archive faction"] },
  { name: "Prada", slug: "prada", era: "1913–Present", origin: "Milan, Italy", aliases: ["prada sport", "linea rossa"] },
  { name: "Raf Simons", slug: "raf-simons", era: "1995–2023", origin: "Antwerp, Belgium", aliases: ["raf", "rafsimons", "riot riot riot", "consumed", "virginia creeper"] },
  { name: "Represent", slug: "represent", era: "2011–Present", origin: "Manchester, UK", aliases: ["represent clo"] },
  { name: "Rick Owens", slug: "rick-owens", era: "1994–Present", origin: "Paris / Owenscorp", aliases: ["drkshdw", "rick", "owens", "geobasket", "ramones"] },
  { name: "Roa Hiking", slug: "roa-hiking", era: "2015–Present", origin: "Italy", aliases: ["roa"] },
  { name: "Saint Laurent", slug: "saint-laurent", era: "1961–Present", origin: "Paris, France", aliases: ["saint laurent paris", "slp", "ysl", "yves saint laurent"] },
  { name: "Saint Michael", slug: "saint-michael", era: "2020–Present", origin: "Tokyo, Japan", aliases: ["saint mxxxxxx", "saint m", "readymade"] },
  { name: "Snow Peak", slug: "snow-peak", era: "1958–Present", origin: "Niigata, Japan", aliases: ["snowpeak"] },
  { name: "SOA", slug: "soa", era: "2021–Present", origin: "Archive Movement", aliases: ["s.o.a", "soa archive"] },
  { name: "Stone Island", slug: "stone-island", era: "1982–Present", origin: "Ravarino, Italy", aliases: ["stoney", "shadow project", "massimo osti"] },
  { name: "Stussy", slug: "stussy", era: "1980–Present", origin: "Laguna Beach, CA", aliases: ["stüssy", "shawn stussy"] },
  { name: "Supreme", slug: "supreme", era: "1994–Present", origin: "New York", aliases: ["sup", "box logo"] },
  { name: "Taichi Murakami", slug: "taichi-murakami", era: "2012–Present", origin: "Tokyo, Japan" },
  { name: "Thug Club", slug: "thug-club", era: "2018–Present", origin: "Seoul, South Korea", aliases: ["tc"] },
  { name: "Undercover", slug: "undercover", era: "1990–Present", origin: "Tokyo, Japan", aliases: ["uc", "jun takahashi", "undercoverism", "scab", "but beautiful"] },
  { name: "Vetements", slug: "vetements", era: "2014–Present", origin: "Zurich / Paris", aliases: ["vet", "demna vetements", "guram gvasalia"] },
  { name: "Visvim", slug: "visvim", era: "2001–Present", origin: "Tokyo, Japan", aliases: ["hiroki nakamura", "fbt"] },
  { name: "Vivienne Westwood", slug: "vivienne-westwood", era: "1971–Present", origin: "London, UK", aliases: ["vivienne", "westwood", "seditionaries"] },
  { name: "Vuja De", slug: "vuja-de", era: "2018–Present", origin: "Tokyo / LA", aliases: ["vujade", "ken ijima"] },
  { name: "Walter Van Beirendonck", slug: "walter-van-beirendonck", era: "1983–Present", origin: "Antwerp, Belgium", aliases: ["wvb", "beirendonck", "w<"] },
  { name: "WTAPS", slug: "wtaps", era: "1996–Present", origin: "Tokyo, Japan", aliases: ["tetsu nishiyama", "w taps"] },
  { name: "Y/Project", slug: "y-project", era: "2010–Present", origin: "Paris, France", aliases: ["yproject", "glenn martens yproject"] },
  { name: "Yohji Yamamoto", slug: "yohji-yamamoto", era: "1981–Present", origin: "Tokyo, Japan", aliases: ["yohji", "pour homme", "y's", "yyph"] },
  { name: "1017 ALYX 9SM", slug: "alyx", era: "2015–Present", origin: "Ferrara / NYC", aliases: ["alyx", "1017 alyx", "matthew williams"] },
];

export const BRAND_NAMES: string[] = ARCHIVE_BRANDS.map((b) => b.name).sort((a, b) => a.localeCompare(b));

export function slugifyBrand(name: string): string {
  if (!name) return "archive-selection";
  const clean = name.trim().toLowerCase();
  
  // Check exact matches or aliases in ARCHIVE_BRANDS
  for (const b of ARCHIVE_BRANDS) {
    if (b.name.toLowerCase() === clean || b.slug === clean) return b.slug;
    if (b.aliases && b.aliases.some((al) => al.toLowerCase() === clean)) return b.slug;
  }
  
  return clean
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeBrand(rawBrand: string): string {
  if (!rawBrand || !rawBrand.trim()) return "Archive Selection";
  const cleaned = rawBrand.trim();
  const lower = cleaned.toLowerCase();

  // 1. Direct match or alias match against ARCHIVE_BRANDS
  for (const b of ARCHIVE_BRANDS) {
    if (b.name.toLowerCase() === lower || b.slug.toLowerCase() === lower) {
      return b.name;
    }
    if (b.aliases && b.aliases.some((al) => al.toLowerCase() === lower)) {
      return b.name;
    }
  }

  // 2. Special acronyms / specific casing preservation
  const acronyms: Record<string, string> = {
    soa: "SOA",
    erd: "Enfants Riches Déprimés",
    paf: "Post Archive Faction (PAF)",
    bbs: "Boris Bidjan Saberi",
    ccp: "Carol Christian Poell",
    cdg: "Comme des Garçons",
    mmy: "Maison Mihara Yasuhiro",
    lv: "Louis Vuitton",
    ysl: "Saint Laurent",
    slp: "Saint Laurent",
    fog: "Fear of God",
    ce: "Cav Empt",
    wtaps: "WTAPS",
    bape: "Bape",
    blcg: "Balenciaga",
    mm6: "Maison Margiela",
    jpg: "Jean Paul Gaultier",
    wvb: "Walter Van Beirendonck",
  };

  if (acronyms[lower]) {
    return acronyms[lower];
  }

  // 3. Fallback: Convert to clean Title Case if in ALL CAPS or all lower
  if (cleaned === cleaned.toUpperCase() || cleaned === cleaned.toLowerCase()) {
    return cleaned
      .split(/[\s_-]+/)
      .map((word) => {
        if (!word) return "";
        if (word.length <= 3 && /^[A-Z0-9]+$/i.test(word) && ["SOA", "PAF", "BBS", "CCP", "CDG", "MMY", "LV", "YSL", "SLP", "FOG", "ERL", "ERD"].includes(word.toUpperCase())) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  }

  return cleaned;
}

export function getAllKnownBrands(existingProducts: any[] = [], discoveredItems: any[] = []): string[] {
  const brandSet = new Set<string>();

  // Add all curated master brands
  for (const b of ARCHIVE_BRANDS) {
    brandSet.add(b.name);
  }

  // Add all catalog brands
  for (const p of existingProducts || []) {
    if (p.brand) {
      brandSet.add(normalizeBrand(p.brand));
    }
  }

  // Add all discovered queue brands
  for (const it of discoveredItems || []) {
    if (it.brand) {
      brandSet.add(normalizeBrand(it.brand));
    }
  }

  return Array.from(brandSet).sort((a, b) => a.localeCompare(b));
}
