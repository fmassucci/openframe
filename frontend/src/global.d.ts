export {};

type PickFolderOptions = {
  mode?: "save" | "open";
  defaultPath?: string;
  title?: string;
};

declare global {
  interface Window {
    openframe?: {
      backendUrl: string;
      platform: string;
      versions: Record<string, string>;
      pickFolder?: (options?: PickFolderOptions) => Promise<string | null>;
    };
  }
}
