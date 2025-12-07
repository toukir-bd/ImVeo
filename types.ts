export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16'
}

export interface VideoState {
  isLoading: boolean;
  progressMessage: string;
  videoUrl: string | null;
  error: string | null;
}

export interface GeneratedVideo {
  uri: string;
}

// Augment the AIStudio interface which is already declared in the environment
declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }
}