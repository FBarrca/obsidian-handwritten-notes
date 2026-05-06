import { Modal, Setting, TFile } from "obsidian";
import type NotePDF from "../main";
import { getTemplatesFolder } from "../utils/utils";

export class TemplateSelectModal extends Modal {
	plugin: NotePDF;
	selectedTemplate: string;
	onSubmit: (template: string) => void;

	constructor(plugin: NotePDF, onSubmit: (template: string) => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.onSubmit = onSubmit;
		this.selectedTemplate = plugin.settings.favoriteTemplate;
	}

	async onOpen() {
		const { contentEl } = this;
		this.setTitle("Select Template");

		const templatesFolder = await getTemplatesFolder(this.plugin);
		
		new Setting(contentEl)
			.setName("Template")
			.setDesc("Select a template for the new page")
			.addDropdown(async (dropdown) => {
				try {
					const { files } = await this.plugin.app.vault.adapter.list(templatesFolder);
					for (const filePath of files) {
						const fileName = filePath.split("/").pop();
						if (!fileName) continue;
						if (fileName.split(".")[1] !== "pdf") continue;
						const name = fileName.split(".")[0].charAt(0).toUpperCase() + fileName.split(".")[0].slice(1);
						dropdown.addOption(fileName, name);
					}
					dropdown.setValue(this.selectedTemplate);
					dropdown.onChange((value) => {
						this.selectedTemplate = value;
					});
				} catch (error) {
					console.error("Error loading templates:", error);
				}
			});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Add Page")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.selectedTemplate);
				}),
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
