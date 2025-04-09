import type { PluginSettings } from "./types";

export const DEFAULT_TEMPLATE_DIR = "/templates/";

export const DEFAULT_TEMPLATE = "blank.pdf";

export const DEFAULT_ASSET_PATH = "/handwritten-notes/";

export const DEFAULT_SETTINGS: PluginSettings = {
	defaultPath: DEFAULT_ASSET_PATH,
	assetUrl: "",
	useRelativePaths: false,
	showWelcomeModal: true,
	collapseEmbeds: false,
	favoriteTemplate: DEFAULT_TEMPLATE,
	templatesAtCustom: false,
	templatesPath: DEFAULT_TEMPLATE_DIR,
};
