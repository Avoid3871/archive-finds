import { GoogleSheetsProvider } from "@/providers/sheets/GoogleSheetsProvider";
import { SugargooAffiliateProvider } from "@/providers/affiliate/SugargooAffiliateProvider";
import { LocalRembgProvider } from "@/providers/backgroundRemoval/LocalRembgProvider";
import { LocalStorageProvider } from "@/providers/storage/LocalStorageProvider";
import { DuplicateDetector } from "./processors/duplicateDetector";
import { ImageProcessor } from "./processors/imageProcessor";

async function runLocalWorker() {
  console.log("==========================================");
  console.log("   ARCHIVE FINDS - LOCAL AUTOMATION WORKER ");
  console.log("==========================================");
  console.log("System Mode: Local PC Background Processor");
  console.log("Time:", new Date().toISOString());

  const sheetsProvider = new GoogleSheetsProvider();
  const affiliateProvider = new SugargooAffiliateProvider();
  const rembgProvider = new LocalRembgProvider();
  const storageProvider = new LocalStorageProvider();

  console.log("\n[Worker Initialized]");
  console.log("- Sheets Engine:", sheetsProvider.name);
  console.log("- Affiliate Engine:", affiliateProvider.name);
  console.log("- Cutout Engine:", rembgProvider.name);
  console.log("- Storage Engine:", storageProvider.name);

  console.log("\nReady to process jobs and scan spreadsheets.");
}

if (require.main === module) {
  runLocalWorker().catch((err) => {
    console.error("[Fatal Worker Error]:", err);
    process.exit(1);
  });
}

export { runLocalWorker };
