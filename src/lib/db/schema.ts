import { pgTable, text, timestamp, boolean, integer, numeric, uuid, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const productStatusEnum = pgEnum("product_status", [
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "FAILED",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "PENDING",
  "RUNNING",
  "SUCCESS",
  "FAILED",
]);

export const jobTypeEnum = pgEnum("job_type", [
  "SCAN_SOURCE",
  "CHECK_PRODUCT",
  "FETCH_PRODUCT",
  "CREATE_AFFILIATE",
  "DOWNLOAD_IMAGE",
  "REMOVE_BACKGROUND",
  "GENERATE_IMAGE",
  "UPDATE_DATABASE",
]);

// 1. Brands Table
export const brands = pgTable("brands", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  origin: text("origin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Categories Table
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Tags Table (Style, Era, Aesthetic)
export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  type: text("type").default("style"), // 'style' | 'era' | 'curation'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Products Table
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  normalizedName: text("normalized_name").notNull(),
  description: text("description"),
  brandId: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  currency: text("currency").notNull().default("EUR"),
  sourceUrl: text("source_url").notNull(),
  affiliateUrl: text("affiliate_url"),
  
  // Image Assets
  originalImageUrl: text("original_image_url"),
  localOriginalImage: text("local_original_image"),
  localCutoutImage: text("local_cutout_image"),
  localFinalImage: text("local_final_image"),
  
  // Status & Curation Flags
  status: productStatusEnum("status").notNull().default("ACTIVE"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isRare: boolean("is_rare").notNull().default(false),
  era: text("era").default("00s"),
  style: text("style").default("Archive"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastCheckedAt: timestamp("last_checked_at"),
});

// 5. ProductTags Junction Table
export const productTags = pgTable(
  "product_tags",
  {
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.tagId] })]
);

// 6. Sources Table (Google Spreadsheets)
export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  spreadsheetId: text("spreadsheet_id").notNull(),
  sheetName: text("sheet_name").default("Sheet1"),
  enabled: boolean("enabled").notNull().default(true),
  lastScannedAt: timestamp("last_scanned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. ProductSources Junction Table (Traceability)
export const productSources = pgTable(
  "product_sources",
  {
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").notNull().references(() => sources.id, { onDelete: "cascade" }),
    sourceUrl: text("source_url").notNull(),
    firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.sourceId] })]
);

// 8. ProductChecks Table (Health & Link Validity)
export const productChecks = pgTable("product_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
  status: text("status").notNull(),
  httpStatus: integer("http_status"),
  finalUrl: text("final_url"),
  errorMessage: text("error_message"),
});

// 9. AffiliateLinks Table
export const affiliateLinks = pgTable("affiliate_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("sugargoo"),
  originalUrl: text("original_url").notNull(),
  affiliateUrl: text("affiliate_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").notNull().default("ACTIVE"),
});

// 10. ProcessingJobs Table (Task Queue)
export const processingJobs = pgTable("processing_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: jobTypeEnum("type").notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  status: jobStatusEnum("status").notNull().default("PENDING"),
  attempts: integer("attempts").notNull().default(0),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  tags: many(productTags),
  sources: many(productSources),
  checks: many(productChecks),
  affiliateLinks: many(affiliateLinks),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));
