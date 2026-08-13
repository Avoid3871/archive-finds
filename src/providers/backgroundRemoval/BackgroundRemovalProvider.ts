export interface CutoutResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  durationMs?: number;
}

export interface IBackgroundRemovalProvider {
  readonly name: string;
  removeBackground(inputImagePath: string, outputImagePath: string): Promise<CutoutResult>;
}
