
import { App, Editor, EditorPosition, FileSystemAdapter } from "obsidian";
export interface AppWithDesktopInternalApi extends App {
    openWithDefaultApp(path: string): Promise<void>;
    showInFolder(path: string): Promise<void>;
}

