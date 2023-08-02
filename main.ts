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

	onOpen() {
		let { contentEl } = this;

		contentEl.createEl("h1", { text: "Create New note" });
		new Setting(contentEl).setName("Name").addText((text) => {
			text.setValue(this.result["name"]);
			text.onChange((value) => {
				this.result["name"] = value;
			});
		});
		new Setting(contentEl).setName("Template").addDropdown((dropDown) => {
			dropDown.addOption("blank.pdf", "Blank");
			dropDown.addOption("lined.pdf", "Lined");
			dropDown.addOption("canvas.pdf", "Canvas");
			dropDown.onChange(async (value) => {
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
				await this.app.vault.createBinary(path, template);
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
				!toolbars[i].contains(
					document.getElementById("annotate" + i)
				)
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
