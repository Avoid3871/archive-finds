import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import path from "path";
import fs from "fs";
import { logJob } from "@/lib/admin/jobLogger";

const execPromise = util.promisify(exec);

export async function GET() {
  try {
    // Check status of repo
    const { stdout: statusOut } = await execPromise("git status --porcelain");
    const { stdout: lastCommit } = await execPromise("git log -1 --format=\"%h - %s (%cr)\"");
    const { stdout: branch } = await execPromise("git branch --show-current");

    const modifiedFiles = statusOut
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    const hasUnsyncedChanges = modifiedFiles.length > 0;

    return NextResponse.json({
      success: true,
      branch: branch.trim() || "main",
      lastCommit: lastCommit.trim(),
      hasUnsyncedChanges,
      changedFilesCount: modifiedFiles.length,
      changedFiles: modifiedFiles.slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const customMessage = body.message;

    // 1. Stage all project files, components, configs, and assets
    await execPromise("git add -A");

    // Check if there are staged changes
    const { stdout: stagedOut } = await execPromise("git diff --staged --name-only");
    const stagedFiles = stagedOut.split("\n").map(s => s.trim()).filter(Boolean);

    if (stagedFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Everything is already in sync with GitHub / Live Website!",
        synced: false,
      });
    }

    // 2. Commit
    const commitMsg = customMessage || `Auto-Sync: Updated catalog & store with new Grails [${new Date().toISOString().split("T")[0]}]`;
    await execPromise(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);

    // 3. Push to GitHub
    let pushSuccess = true;
    let pushError = null;
    try {
      await execPromise("git push origin main");
    } catch (pushErr: any) {
      pushSuccess = false;
      pushError = pushErr.message;
    }

    const durationMs = Date.now() - startTime;

    // Log job to live job queue
    try {
      logJob({
        type: "LIVE_STORE_SYNC",
        title: "Live Store & GitHub Auto-Sync",
        details: pushSuccess
          ? `Successfully synced ${stagedFiles.length} files to live repository.`
          : `Committed locally. Push notice: ${pushError}`,
        status: pushSuccess ? "SUCCESS" : "WARNING",
        durationMs,
        metadata: {
          stagedFilesCount: stagedFiles.length,
          commitMsg,
          pushSuccess,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: pushSuccess
        ? "✓ Successfully deployed and synced with Live Website (GitHub / Vercel)!"
        : "✓ Catalog committed locally. (Remote push requires git credentials)",
      stagedFilesCount: stagedFiles.length,
      commitMsg,
      pushSuccess,
      pushError,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    try {
      logJob({
        type: "LIVE_STORE_SYNC",
        title: "Live Store Sync Failed",
        details: error.message,
        status: "FAILED",
        durationMs,
      });
    } catch (e) {}

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
