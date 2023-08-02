import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	Setting,
	normalizePath,
	FileSystemAdapter,
	DataAdapter,
	Platform,
	View,
} from "obsidian";

export class PDFCreatorModal extends Modal {
	result: { name: string; template: string } = {
		name: "New note",
		template: "blank.pdf",
	};
	onSubmit: (result: { name: string; template: string }) => void;

	constructor(
		app: App,
		onSubmit: (result: { name: string; template: string }) => void
	) {
		super(app);
		this.onSubmit = onSubmit;
	}

	async onOpen() {
		let { contentEl } = this;

		contentEl.createEl("h1", { text: "Create New note" });
		new Setting(contentEl).setName("Name").addText((text) => {
			text.setValue(this.result["name"]);
			text.onChange((value) => {
				this.result["name"] = value;
			});
		});
		new Setting(contentEl)
			.setName("Template")
			.addDropdown(async (dropDown) => {
				// read all files in the template folder
				// add them to the dropdown menu
				const templateFolder = normalizePath(
					this.app.vault.configDir +
						"/plugins/obsidian-handwritten-notes/templates/"
				);

				const files = (
					await this.app.vault.adapter.list(templateFolder)
				).files;
				for (let i = 0; i < files.length; i++) {
					// get the file name, it is the last part of the path
					const file = files[i].split("/").pop();
					if (!file) continue; // skip if the file is null
					// check if the file is a pdf
					if (file.split(".")[1] !== "pdf") continue;
					// name should be the filename without the extension and capitalized
					const fileName = file?.split(".")[0]?.charAt(0).toUpperCase() + file?.split(".")[0]?.slice(1);
					dropDown.addOption(file, fileName);
				}
				dropDown.onChange((value) => {
					this.result["template"] = value;
				});
			});
		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.result);
				})
		);
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}

export default class NotePDF extends Plugin {
	async loadPdfTemplate(template: string) {
		// check if it is a mobile adapter
		let result = null;

		result = await this.app.vault.adapter.readBinary(
			normalizePath(
				this.app.vault.configDir +
					"/plugins/obsidian-handwritten-notes/templates/" +
					template
			)
		);
		return result;
	}

	async createPDF() {
		await new PDFCreatorModal(this.app, async (result) => {
			const useRoot = false;
			const destFolder = useRoot
				? this.app.vault.getRoot()
				: this.app.workspace.getActiveFile()?.parent;

			if (destFolder) {
				const template = await this.loadPdfTemplate(result.template);
				console.log("Template: " + template);
				const path = destFolder.path + "/" + result.name + ".pdf";
				console.log("Creating PDF at " + path);
				try {
				await this.app.vault.createBinary(path, template);
				} catch (e) {
					// see if error is because file already exists
					if (e.message.includes("already exists")) {
						// if the file already exists, show a notice
						new Notice("File already exists!");
						console.log(e);
					} else {
						new Notice("Error creating file! Note: " + e.message);
						 
						console.log(e); 
				}
			}
		}
		}).open();
	}
	addAnnotateButton() {
		console.log("Active leaf changed!");
		const active_view = app.workspace.getActiveViewOfType(View);
		if (!active_view) return;
		let view_type = active_view.getViewType();
		if (view_type !== "pdf") return;

		console.log("PDF file opened!");
		//  find HTML element with class 'markdown-preview-sizer'
		// get Document
		const doc = active_view.containerEl.ownerDocument;
		console.log(doc);
		const toolbars = document.getElementsByClassName("pdf-toolbar");
		//  Loop through all the elements with class 'markdown-preview-sizer'
		for (let i = 0; i < toolbars.length; i++) {
			//  check if it has a child with id 'annotate'
			if (
				!toolbars[i].contains(document.getElementById("annotate" + i))
			) {
				// add a child inside markdownPreviewSizer
				const button = doc.createElement("button");
				// give it an id of 'annotate' + i
				button.id = "annotate" + i;
				button.innerHTML = "Annotate";
				button.onclick = () => {
					this.app.commands.executeCommandById(
						"open-with-default-app:open"
					);
				};
				toolbars[i].appendChild(button);
			}
		}
	}
	async onload() {
		const ribbonIconEl = this.addRibbonIcon(
			"pencil",
			"Create empty PDF note",
			(evt: MouseEvent) => {
				this.createPDF();
			}
		);

		this.addCommand({
			id: "create-empty-pdf-note",
			name: "Create empty PDF note",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.createPDF();
			},
		});

		this.addAnnotateButton(); // Also try to add the button when the plugin is loaded
		this.app.workspace.on("active-leaf-change", () => {
			this.addAnnotateButton();
		});
	}
}
