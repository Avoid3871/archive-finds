import { spawn } from "child_process";
import path from "path";
import { IBackgroundRemovalProvider, CutoutResult } from "./BackgroundRemovalProvider";

export class LocalRembgProvider implements IBackgroundRemovalProvider {
  readonly name = "local-rembg";
  private pythonPath: string;
  private scriptPath: string;

  constructor(pythonPath?: string) {
    this.pythonPath = pythonPath || process.env.PYTHON_PATH || "python";
    this.scriptPath = path.resolve(process.cwd(), "python/background_removal/remove_bg.py");
  }

  async removeBackground(inputImagePath: string, outputImagePath: string): Promise<CutoutResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const child = spawn(this.pythonPath, [
        this.scriptPath,
        "--input",
        inputImagePath,
        "--output",
        outputImagePath,
      ]);

      let stderr = "";
      let stdout = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        const durationMs = Date.now() - startTime;
        if (code === 0) {
          resolve({
            success: true,
            outputPath: outputImagePath,
            durationMs,
          });
        } else {
          resolve({
            success: false,
            error: stderr || stdout || `Process exited with code ${code}`,
            durationMs,
          });
        }
      });

      child.on("error", (err) => {
        resolve({
          success: false,
          error: err.message,
          durationMs: Date.now() - startTime,
        });
      });
    });
  }
}
