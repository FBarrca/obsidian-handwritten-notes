import {
	type App,
	Modal,
	type PluginManifest,
	type SearchComponent,
	Setting,
	normalizePath,
} from "obsidian";
import type NotePDF from "../main";
import type { NewNote } from "../utils/types";
import { ChooseDestinationSearch } from "./PathModals";

export class PDFCreatorModal extends Modal {
	result: NewNote = {
		name: "New note",
		template: "blank.pdf",
	};
	manifest: PluginManifest;
	plugin: NotePDF;
	favoriteTemplate: string;
	onSubmitCallback: (result: NewNote) => void;
	templatesFolder: string;
	chooseDest = false;
	inEditor = false;

	constructor(
		plugin: NotePDF,
		templatesFolder: string,
		onSubmit: (result: NewNote) => void,
		chooseDest?: boolean,
		inEditor?: boolean,
	) {
		super(plugin.app);
		this.onSubmitCallback = onSubmit;
		this.manifest = plugin.manifest;
		this.favoriteTemplate = plugin.settings.favoriteTemplate;
		this.templatesFolder = templatesFolder;
		this.chooseDest = chooseDest;
		this.plugin = plugin;
		this.inEditor = inEditor;
	}
	async onOpen() {
		const { contentEl } = this;
		this.setTitle("Create new note from template");
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

		// ONLY IF CHOOSEDEST IS TRUE
		if (this.chooseDest) {
			this.result.path = this.inEditor
				? await this.plugin.getDestFolder()
				: this.plugin.settings.defaultPath;
			let search: SearchComponent;
			new Setting(contentEl)
				.setName("Destination")
				.addSearch((cb) => {
					cb.setPlaceholder("Choose a folder");
					cb.setValue(this.result.path);
					new ChooseDestinationSearch(cb.inputEl, this.app, (value) => {
						this.result.path = value.path;
					});
					search = cb;
				})
				.addExtraButton((btn) =>
					btn
						.setIcon("refresh-ccw")
						.setTooltip("Set to default")
						.onClick(async () => {
							this.result.path = this.plugin.settings.defaultPath;
							search.setValue(this.result.path);
						}),
				);
		}
		// CLOSE BUTTON
		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					this.close();
					this.result.path = this.result.path.trim().length === 0 ? undefined : this.result.path;
					this.onSubmitCallback(this.result);
				}),
		);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
