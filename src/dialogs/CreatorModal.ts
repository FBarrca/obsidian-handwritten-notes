import {
	type App,
	Modal,
	type PluginManifest,
	Setting,
	normalizePath,
} from "obsidian";
import type { NewNote } from "../utils/types";

export class PDFCreatorModal extends Modal {
	result: NewNote = {
		name: "New note",
		template: "blank.pdf",
	};
	manifest: PluginManifest;
	favoriteTemplate: string;
	onSubmitCallback: (result: NewNote) => void;
	templatesFolder: string;

	constructor(
		app: App,
		manifest: PluginManifest,
		favoriteTemplate: string,
		templatesFolder: string,
		onSubmit: (result: NewNote) => void,
	) {
		super(app);
		this.onSubmitCallback = onSubmit;
		this.manifest = manifest;
		this.favoriteTemplate = favoriteTemplate;
		this.templatesFolder = templatesFolder;
	}
	async onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Create new note from template" });
		// NAME
		new Setting(contentEl).setName("Name").addText((text) => {
			text.setValue(this.result.name);
			text.onChange((value) => {
				this.result.name = value;
			});
			// on enter, submit the modal
			text.inputEl.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					this.close();
					this.onSubmitCallback(this.result);
				}
			});
		});
		// TEMPLATE DROPDOWN
		new Setting(contentEl).setName("Template").addDropdown(async (dropDown) => {
			// read all files in the template folder
			for (const filePath of (
				await this.app.vault.adapter.list(this.templatesFolder)
			).files) {
				const fileName = filePath.split("/").pop();
				if (!fileName) continue; // skip if the file is null
				if (fileName.split(".")[1] !== "pdf") continue; // check if the file is a pdf

				const name = // name should be the filename without the extension and capitalized
					fileName?.split(".")[0]?.charAt(0).toUpperCase() +
					fileName?.split(".")[0]?.slice(1);
				dropDown.addOption(fileName, name);
			}
			// default value is the favorite template
			dropDown.setValue(this.favoriteTemplate);
			this.result.template = this.favoriteTemplate;
			dropDown.onChange((value) => {
				this.result.template = value;
			});
		});
		// CLOSE BUTTON
		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmitCallback(this.result);
				}),
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
