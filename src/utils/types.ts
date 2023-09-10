import { Notice } from "obsidian";

// Parameters needed to create a new note
export interface newNote {
  name: string;
  template: string;
  path?: string;
}

export interface PluginSettings {
  templatePath: string;
  assetUrl: string;
  useRelativePaths: boolean;
  showWelcomeModal: boolean;
  collapseEmbeds: boolean;
  favoriteTemplate: string;
}

export class FileExistsError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "FileExistsError";
    new Notice(message);
  }
}

export class TemplateNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "TemplateNotFoundError";
    new Notice(message);
  }
}
