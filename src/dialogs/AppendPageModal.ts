import {
	AbstractInputSuggest,
	Modal,
	Setting,
	TFile,
} from "obsidian";
import type NotePDF from "../main";

class PdfFileSuggest extends AbstractInputSuggest<TFile> {
	constructor(
		private inputEl: HTMLInputElement,
		app: NotePDF["app"],
		private onFileSelect: (value: TFile) => void,
	) {
		super(app, inputEl);
	}

	getSuggestions(query: string): TFile[] {
		return this.app.vault
			.getFiles()
			.filter(
				(file) =>
					file.extension === "pdf" &&
					file.path.toLowerCase().contains(query.toLowerCase()),
			);
	}

	renderSuggestion(value: TFile, el: HTMLElement) {
		el.createEl("div", { text: value.name });
		el.createEl("small", { text: value.path });
	}

	selectSuggestion(value: TFile, _evt: MouseEvent | KeyboardEvent): void {
		this.inputEl.value = value.path;
		this.onFileSelect(value);
		this.inputEl.focus();
		this.inputEl.trigger("input");
		this.close();
	}
}

export interface AppendPageResult {
	pdfPath: string;
	template: string;
}

export class AppendPageModal extends Modal {
	plugin: NotePDF;
	result: AppendPageResult;
	templatesFolder: string;
	onSubmitCallback: (result: AppendPageResult) => void;

	constructor(
		plugin: NotePDF,
		templatesFolder: string,
		onSubmit: (result: AppendPageResult) => void,
	) {
		super(plugin.app);
		this.plugin = plugin;
		this.templatesFolder = templatesFolder;
		this.onSubmitCallback = onSubmit;
		this.result = {
			pdfPath: "",
			template: plugin.settings.favoriteTemplate,
		};
	}

	async onOpen() {
		const { contentEl } = this;
		this.setTitle("Add page to existing PDF");

		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile && activeFile.extension === "pdf") {
			this.result.pdfPath = activeFile.path;
		}

		new Setting(contentEl)
			.setName("Existing PDF")
			.setDesc("Select a PDF to add a page to")
			.addSearch((cb) => {
				cb.setPlaceholder("Search for a PDF file");
				cb.setValue(this.result.pdfPath);
				new PdfFileSuggest(cb.inputEl, this.app, (value) => {
					this.result.pdfPath = value.path;
				});
				cb.onChange((value) => {
					this.result.pdfPath = value;
				});
			});

		new Setting(contentEl)
			.setName("Template")
			.setDesc("Select a template page to add")
			.addDropdown(async (dropDown) => {
				const { files } = await this.app.vault.adapter.list(
					this.templatesFolder,
				);
				for (const filePath of files) {
					const fileName = filePath.split("/").pop();
					if (!fileName) continue;
					if (fileName.split(".")[1] !== "pdf") continue;
					const name =
						fileName?.split(".")[0]?.charAt(0).toUpperCase() +
						fileName?.split(".")[0]?.slice(1);
					dropDown.addOption(fileName, name);
				}
				dropDown.setValue(this.plugin.settings.favoriteTemplate);
				this.result.template = this.plugin.settings.favoriteTemplate;
				dropDown.onChange((value) => {
					this.result.template = value;
				});
			});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Add Page")
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
