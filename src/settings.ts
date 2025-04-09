// Obsidian imports
import {
	type App,
	ButtonComponent,
	MarkdownRenderer,
	Platform,
	PluginSettingTab,
	Setting,
	normalizePath,
} from "obsidian";

import {
	DEFAULT_ASSET_PATH,
	DEFAULT_TEMPLATE,
	DEFAULT_TEMPLATE_DIR,
} from "./utils/constants";
// Local imports
import type { AppWithDesktopInternalApi } from "./utils/helpers";

import type NotePDF from "./main";
import { getTemplatesFolder, initTemplatesFolder } from "./utils/utils";

export class NotePDFSettingsTab extends PluginSettingTab {
	private readonly plugin: NotePDF;

	constructor(app: App, plugin: NotePDF) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl: modal } = this;
		modal.empty();
		// GENERAL SETTINGS
		modal.createEl("h2", {
			text: "General Settings",
		});
		this.CollapseEmbedsToggle();
		// Generate new note
		modal.createEl("h2", {
			text: "Create new note",
		});
		this.createRelativePathToggle();
		if (!this.plugin.settings.useRelativePaths) {
			this.createDefaultPathTextInput();
		}
		// Settings heading
		// TEMPLATES
		this.createTemplatesSection();
		this.createTemplateFolderPath();
		this.createSettingWithOptions();
	}

	private CollapseEmbedsToggle(): void {
		new Setting(this.containerEl)
			.setName("Collapse embeds")
			.setDesc("Collapse embeds by default to save vertical space.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.collapseEmbeds)
					.onChange(async (value) => {
						this.plugin.settings.collapseEmbeds = value;
						await this.plugin.saveSettings();
					}),
			);
	}
	private createRelativePathToggle(): void {
		new Setting(this.containerEl)
			.setName("Use relative path")
			.setDesc("Use relative path when creating the file.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useRelativePaths)
					.onChange(async (value) => {
						this.plugin.settings.useRelativePaths = value;
						await this.plugin.saveSettings();
						this.display();
					}),
			);
	}

	private createDefaultPathTextInput(): void {
		new Setting(this.containerEl)
			.setName("Default Path for new notes")
			.setDesc("Path to be used if relative path is disabled.")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_ASSET_PATH)
					.setValue(this.plugin.settings.defaultPath)
					.onChange(async (value) => {
						this.plugin.settings.defaultPath = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	private async createTemplatesSection(): Promise<void> {
		// add a div
		const titleEl = this.containerEl.createDiv();
		titleEl.innerText = "Templates";
		titleEl.addClass("setting-item-heading");
		titleEl.addClass("setting-item");

		if (Platform.isDesktop) {
			this.createFolderButton(titleEl);
		}
		const pluginFolder = await getTemplatesFolder(this.plugin);
		MarkdownRenderer.render(
			this.app,
			`You can use **any** PDF as a template for the notes. Just add it to the templates folder and it will appear here. 
      \`${pluginFolder}\``,
			this.containerEl,
			"",
			this.plugin,
		);
	}

	private createTemplateFolderPath(): void {
		// Whether the templates should be stored in a custom folder
		new Setting(this.containerEl)
			.setName("Store templates in a custom folder")
			.setDesc(
				"Store the templates in a custom folder outside the plugin path. (May resolve issues with syncing)",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.templatesAtCustom)
					.onChange(async (value) => {
						!value // If the value is false, set the path to the default path
							? // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
								(this.plugin.settings.templatesPath = DEFAULT_TEMPLATE_DIR)
							: null;
						this.plugin.settings.templatesAtCustom = value;
						await this.plugin.saveSettings();
						await initTemplatesFolder(this.plugin);
						this.display();
					}),
			);
		if (!this.plugin.settings.templatesAtCustom) return;
		// Folder relative to the plugin
		new Setting(this.containerEl)
			.setName("Templates folder")
			.setDesc("Path to the templates folder.")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_TEMPLATE_DIR)
					.setValue(this.plugin.settings.templatesPath)
					.onChange(async (value) => {
						this.plugin.settings.templatesPath = value;
						await this.plugin.saveSettings();
					}),
			);
		// Dividing line
	}

	private createFolderButton(parentEl: HTMLElement): void {
		// div for the buttons
		const buttonContainer = parentEl.createDiv();
		buttonContainer.addClass("setting-item-control");
		// Reload button
		const reloadButton = new ButtonComponent(buttonContainer)
			.setIcon("sync")
			.setClass("clickable-icon")
			.setClass("setting-editor-extra-setting-button")
			.setTooltip("Reload templates");
		reloadButton.onClick(() => {
			initTemplatesFolder(this.plugin); // Reload default template just in case
			this.display();
		});
		const folderButton = new ButtonComponent(buttonContainer)
			.setIcon("folder")
			.setClass("clickable-icon")
			// .setClass("settings-folder-button")
			.setClass("setting-editor-extra-setting-button")
			.setTooltip("Open templates folder in the explorer");
		folderButton.onClick(async () => {
			await (this.app as AppWithDesktopInternalApi).showInFolder(
				normalizePath(
					`${await getTemplatesFolder(this.plugin)}/${DEFAULT_TEMPLATE}`,
				),
			);
		});
	}

	private async createSettingWithOptions(): Promise<void> {
		const { containerEl } = this;
		MarkdownRenderer.render(
			this.app,
			"### Available Templates",
			containerEl,
			"",
			this.plugin,
		);

		const scrollContainer = containerEl.createDiv();
		scrollContainer.addClass("settings-scroll-container");

		// Show also templates in the templates folder
		const templatePath = await getTemplatesFolder(this.plugin);
		const templates = await this.app.vault.adapter.list(templatePath);
		// iterate over the templates and show them
		for (const filePath of templates.files) {
			const fileName = filePath.split("/").pop();
			// fileName without extension and capitalized
			const title = fileName
				?.split(".")[0]
				.replace(/-/g, " ")
				.replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));
			const setting = new Setting(scrollContainer)
				.setName(title)
				.setDesc(fileName);

			this.favoriteButton(setting, fileName);
			// Delete button and lock for default template
			this.deleteButton(setting, filePath, fileName);
		}
	}

	private deleteButton(
		setting: Setting,
		filePath: string,
		fileName: string,
	): void {
		// Default file cant be deleted
		if (fileName === DEFAULT_TEMPLATE) {
			// Add a lock icon
			setting.addButton((button) =>
				button
					.setIcon("lock")
					.setTooltip("Default template")
					.setClass("settings-button")
					.setClass("settings-folder-button"),
			);
		} else {
			setting.addButton((button) =>
				button
					.setIcon("trash")
					.setTooltip("Delete template")
					.setClass("settings-button")
					.onClick(async () => {
						// Check if the template is the favorite template
						if (this.isDefaultTemplate(fileName))
							this.plugin.settings.favoriteTemplate = DEFAULT_TEMPLATE;
						try {
							await this.app.vault.adapter.remove(filePath);
							console.log(`Deleted asset: ${filePath}`);
							this.display();
						} catch (err) {
							console.error(`Error deleting asset ${filePath}:`, err);
						}
					}),
			);
		}
	}

	private isDefaultTemplate(fileName: string): boolean {
		return fileName === this.plugin.settings.favoriteTemplate;
	}

	private favoriteButton(setting: Setting, fileName: string): void {
		setting.addButton((button) =>
			button
				.setIcon(
					this.plugin.settings.favoriteTemplate === fileName
						? "star"
						: "crossed-star",
				)
				.setTooltip("Favorite template")
				.setClass("settings-button")
				.onClick(() => {
					// if the template is not favorite, make it favorite else do nothing
					if (this.isDefaultTemplate(fileName)) return;
					this.plugin.settings.favoriteTemplate = fileName;
					this.plugin.saveSettings();
					// refresh the settings tab
					this.display();
				}),
		);
	}
}
