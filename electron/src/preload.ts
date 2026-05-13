import { contextBridge, ipcRenderer } from "electron";

type PickFolderOptions = {
  mode?: "save" | "open";
  defaultPath?: string;
  title?: string;
};

contextBridge.exposeInMainWorld("openframe", {
  backendUrl: process.env.OPENFRAME_BACKEND_URL ?? "http://127.0.0.1:4777",
  platform: process.platform,
  versions: process.versions,
  pickFolder: (options: PickFolderOptions = {}): Promise<string | null> =>
    ipcRenderer.invoke("openframe:pickFolder", options)
});
