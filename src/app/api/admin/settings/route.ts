import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { AGENTS_CONFIG } from "@/lib/agents/agentConfig";

const SETTINGS_FILE = path.join(process.cwd(), "scratch", "admin_settings.json");

interface AdminSettingsPayload {
  agents: {
    sugargoo: { affiliateId: string };
    superbuy: { affiliateId: string };
    mulebuy: { affiliateId: string };
    cnfans: { affiliateId: string };
    cssbuy: { affiliateId: string; inviter?: string };
    kakobuy: { affiliateId: string };
    hoobuy: { affiliateId: string };
  };
  worker: {
    pythonPath: string;
    autoScanInterval: string;
  };
  security: {
    adminPassword?: string;
  };
}

function getDefaultSettings(): AdminSettingsPayload {
  return {
    agents: {
      sugargoo: { affiliateId: AGENTS_CONFIG.sugargoo.affiliateId || "1325437696506389977" },
      superbuy: { affiliateId: AGENTS_CONFIG.superbuy.affiliateId || "wVam6e" },
      mulebuy: { affiliateId: AGENTS_CONFIG.mulebuy.affiliateId || "201493429" },
      cnfans: { affiliateId: AGENTS_CONFIG.cnfans.affiliateId || "16313214" },
      cssbuy: { affiliateId: AGENTS_CONFIG.cssbuy.affiliateId || "8e51fa03f5b9b13a", inviter: "z3r0x" },
      kakobuy: { affiliateId: AGENTS_CONFIG.kakobuy.affiliateId || "ut9mq" },
      hoobuy: { affiliateId: AGENTS_CONFIG.hoobuy.affiliateId || "PR3YGPpE" },
    },
    worker: {
      pythonPath: "python",
      autoScanInterval: "60",
    },
    security: {
      adminPassword: "archivefinds2026",
    },
  };
}

export async function GET() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      return NextResponse.json({ success: true, settings: { ...getDefaultSettings(), ...data } });
    }
    return NextResponse.json({ success: true, settings: getDefaultSettings() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, settings: getDefaultSettings() });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentSettings = getDefaultSettings();
    const updatedSettings = {
      agents: {
        ...currentSettings.agents,
        ...(body.agents || {}),
      },
      worker: {
        ...currentSettings.worker,
        ...(body.worker || {}),
      },
      security: {
        ...currentSettings.security,
        ...(body.security || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2), "utf-8");

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
