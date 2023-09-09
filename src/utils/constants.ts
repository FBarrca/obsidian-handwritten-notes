import { PluginSettings } from "./types";

export const TEMPLATE_DIR = "/templates/";

export const DEFAULT_TEMPLATE = "blank.pdf";

export const DEFAULT_ASSET_PATH = "/handwritten-notes/";

export const DEFAULT_SETTINGS: PluginSettings = {
  templatePath: DEFAULT_ASSET_PATH,
  assetUrl: "",
  useRelativePaths: false,
  showWelcomeModal: true,
  favoriteTemplate: DEFAULT_TEMPLATE,
};
