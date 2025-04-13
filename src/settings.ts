// Obsidian imports
import {
	type App,
	MarkdownRenderer,
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

	async display(): Promise<void> {
		const { containerEl: modal } = this;
		modal.empty();
		// GENERAL SETTINGS
		new Setting(modal).setName("General").setHeading();
		this.CollapseEmbedsToggle();
		this.openInNewTabButton();
		// Generate new note
		new Setting(modal).setName("Creation").setHeading();
		this.createRelativePathToggle();
		this.createDefaultPathTextInput();
		this.createFolderIfNotExists();
		// Settings heading
		// TEMPLATES
		await this.createTemplatesSection();
		this.createTemplateFolderPath();
		await this.createSettingWithOptions();
	}
	
	private createFolderIfNotExists(): void {
		new Setting(this.containerEl)
			.setName("Create folder if not exists")
			.setDesc("Create the folder if it does not exist when choosing destination outside of default path/relative path.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.createFolderIfNotExists)
					.onChange(async (value) => {
						this.plugin.settings.createFolderIfNotExists = value;
						await this.plugin.saveSettings();
					}),
			);
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
						await this.display();
					}),
			);
	}

	private createDefaultPathTextInput(): void {
		new Setting(this.containerEl)
			.setName("Default Path for new notes")
			.setDesc(
				"Path to be used if relative path is disabled or can't be used (no active file while creating).",
			)
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
		const titleEl = new Setting(this.containerEl)
			.setName("Templates")
			.setHeading();
		this.createFolderButton(titleEl);
		const pluginFolder = await getTemplatesFolder(this.plugin);
		await MarkdownRenderer.render(
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
						await this.display();
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

	private createFolderButton(title: Setting): void {
		// div for the buttons
		title.addExtraButton((button) => {
			button
				.setIcon("sync")
				.setTooltip("Reload templates")
				.onClick(async () => {
					await initTemplatesFolder(this.plugin); // Reload default template just in case
					await this.display();
				});
		});
		title.addExtraButton((button) => {
			button
				.setIcon("folder")
				.setTooltip("Open templates folder in the explorer")
				.onClick(async () => {
					await (this.app as AppWithDesktopInternalApi).showInFolder(
						normalizePath(
							`${await getTemplatesFolder(this.plugin)}/${DEFAULT_TEMPLATE}`,
						),
					);
				});
		});
	}

	private async createSettingWithOptions(): Promise<void> {
		const { containerEl } = this;
		await MarkdownRenderer.render(
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
							//console.log(`Deleted asset: ${filePath}`);
							await this.display();
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

	private openInNewTabButton() {
		new Setting(this.containerEl)
			.setName("Open in new tab")
			.setDesc(
				"Open the generated file in a new tab instead of the active tab.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.openInNewTab)
					.onChange(async (value) => {
						this.plugin.settings.openInNewTab = value;
						await this.plugin.saveSettings();
						await this.display();
					}),
			);
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
				.onClick(async () => {
					// if the template is not favorite, make it favorite else do nothing
					if (this.isDefaultTemplate(fileName)) return;
					this.plugin.settings.favoriteTemplate = fileName;
					await this.plugin.saveSettings();
					// refresh the settings tab
					await this.display();
				}),
		);
	}
}
