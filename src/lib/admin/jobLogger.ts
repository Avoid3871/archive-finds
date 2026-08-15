import fs from "fs";
import path from "path";

export interface JobRecord {
  id: string;
  type: string;
  pieceName: string;
  status: "SUCCESS" | "RUNNING" | "PENDING" | "FAILED";
  duration: string;
  durationMs: number;
  timestamp: string;
  details?: string;
}

const JOBS_FILE = path.join(process.cwd(), "src", "lib", "admin", "jobs_history.json");

export function getJobsHistory(): JobRecord[] {
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const data = fs.readFileSync(JOBS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading jobs history:", e);
  }
  return [];
}

export function logJobRecord({
  type,
  pieceName,
  title,
  status = "SUCCESS",
  durationMs = 1000,
  details = "",
}: {
  type: string;
  pieceName?: string;
  title?: string;
  status?: "SUCCESS" | "RUNNING" | "PENDING" | "FAILED" | "WARNING";
  durationMs?: number;
  details?: string;
  metadata?: any;
}): JobRecord {
  try {
    const jobs = getJobsHistory();
    const jobNum = Math.floor(Date.now() % 100000);
    const durationStr = durationMs >= 1000 ? `${(durationMs / 1000).toFixed(1)}s` : `${Math.round(durationMs)}ms`;

    const newJob: JobRecord = {
      id: `job-${jobNum}`,
      type: type.toUpperCase(),
      pieceName: pieceName || title || "System Worker",
      status: status === "WARNING" ? "SUCCESS" : status,
      duration: durationStr,
      durationMs: Math.round(durationMs),
      timestamp: new Date().toISOString(),
      details,
    };

    jobs.unshift(newJob);
    const trimmed = jobs.slice(0, 200);

    const dir = path.dirname(JOBS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(JOBS_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
    return newJob;
  } catch (e) {
    console.error("Error logging job record:", e);
    return {
      id: `job-${Date.now()}`,
      type,
      pieceName,
      status,
      duration: "0ms",
      durationMs: 0,
      timestamp: new Date().toISOString(),
      details,
    };
  }
}

export function clearJobsHistory(): boolean {
  try {
    if (fs.existsSync(JOBS_FILE)) {
      fs.writeFileSync(JOBS_FILE, JSON.stringify([], null, 2), "utf-8");
      return true;
    }
  } catch (e) {
    console.error("Error clearing jobs history:", e);
  }
  return false;
}

export const logJob = logJobRecord;

