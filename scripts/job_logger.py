import json
import os
import time
from datetime import datetime

JOBS_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "admin", "jobs_history.json")

def log_job(job_type: str, piece_name: str, status: str = "SUCCESS", duration_ms: float = 1000, details: str = ""):
    try:
        jobs = []
        if os.path.exists(JOBS_FILE):
            try:
                with open(JOBS_FILE, "r", encoding="utf-8") as f:
                    jobs = json.load(f)
            except Exception:
                jobs = []
        
        job_num = int(time.time() * 1000) % 100000
        duration_str = f"{duration_ms / 1000.0:.1f}s" if duration_ms >= 1000 else f"{int(duration_ms)}ms"
        
        new_job = {
            "id": f"job-{job_num}",
            "type": job_type.upper(),
            "pieceName": piece_name or "Background Task",
            "status": status.upper(),
            "duration": duration_str,
            "durationMs": int(duration_ms),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "details": details
        }
        
        # Prepend newest first, keep last 200 jobs
        jobs.insert(0, new_job)
        jobs = jobs[:200]
        
        with open(JOBS_FILE, "w", encoding="utf-8") as f:
            json.dump(jobs, f, indent=2, ensure_ascii=False)
            
        return new_job
    except Exception as e:
        print(f"[JOB LOGGER ERROR] {e}", flush=True)
        return None

if __name__ == "__main__":
    log_job("TEST_TASK", "Pipeline Diagnostics", "SUCCESS", 450, "Direct CLI test verification")
    print("Job logged successfully.")
