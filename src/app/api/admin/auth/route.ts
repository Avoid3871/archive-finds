import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const SETTINGS_FILE = path.join(process.cwd(), "scratch", "admin_settings.json");
const AUTH_COOKIE_NAME = "af_admin_session";

function getMasterPassword(): string {
  // 1. Check admin_settings.json
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      if (data?.security?.adminPassword && typeof data.security.adminPassword === "string" && data.security.adminPassword.trim() !== "") {
        return data.security.adminPassword.trim();
      }
    } catch {
      // Fallback
    }
  }

  // 2. Check process.env.ADMIN_PASSWORD
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim() !== "") {
    return process.env.ADMIN_PASSWORD.trim();
  }

  // 3. Secure default
  return "archivefinds2026";
}

function generateToken(password: string): string {
  const secret = process.env.AUTH_SECRET || "archive_finds_operator_secret_salt_2026";
  return crypto.createHmac("sha256", secret).update(`operator:${password}`).digest("hex");
}

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [k, ...v] = c.split("=");
        return [k, v.join("=")];
      })
    );

    const token = cookies[AUTH_COOKIE_NAME];
    const masterPass = getMasterPassword();
    const expectedToken = generateToken(masterPass);

    const isAuthenticated = Boolean(token && token === expectedToken);

    return NextResponse.json({
      authenticated: isAuthenticated,
    });
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inputPassword = (body.password || "").trim();
    const masterPass = getMasterPassword();

    if (!inputPassword) {
      return NextResponse.json(
        { success: false, error: "Password is required." },
        { status: 400 }
      );
    }

    if (inputPassword !== masterPass) {
      return NextResponse.json(
        { success: false, error: "Invalid operator passphrase. Access denied." },
        { status: 401 }
      );
    }

    const token = generateToken(masterPass);
    const response = NextResponse.json({
      success: true,
      message: "Operator access granted.",
    });

    // Set secure cookie valid for 30 days
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: false, // Accessible to client-side checks
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Authentication error." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    authenticated: false,
    message: "Operator locked out successfully.",
  });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
