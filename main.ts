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
} from "obsidian";

export function buildPluginStaticResourceSrc(plug: NotePDF, assetPath: string) {
	return plug.app.vault.adapter.getResourcePath(
		plug.app.vault.configDir +
			"/plugins/" +
			plug.manifest.id +
			"/" +
			assetPath
	);
}

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
			dropDown.addOption("blank.pdf", "blank.pdf");
			dropDown.addOption("lined.pdf", "lined.pdf");
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
		console.log("Adapter: breaks here");
		if (this.app.adapter instanceof FileSystemAdapter) {
			console.log("Desktop");
			console.log();
			result = await this.app.vault.adapter.readBinary(
				this.app.vault.configDir +
					"/plugins/obsidian-sample-plugin/" +
					template
			);
		} else {
			console.log("Mobile");
			// its a DataAdapter
			console.log("Name: " + template);
			result = await this.app.vault.adapter.readBinary(
				normalizePath(
					this.app.vault.configDir +
						"/plugins/obsidian-sample-plugin/" +
						template
				)
			);
		}

		return result;
	}

	async createPDF() {
		await new PDFCreatorModal(this.app, async (result) => {
			const pathToPlugin = normalizePath(
				this.app.vault.configDir + "/plugins/obsidian-sample-plugin/"
			);
			const pathToPdf = normalizePath(
				pathToPlugin + "/" + result.template
			);
			console.log("Path to PDF: " + pathToPdf);
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

	async onload() {
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
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
		const ribbonIconEl2 = this.addRibbonIcon(
			"pencil",
			"Create empty PDF note",
			(evt: MouseEvent) => {
				this.app.commands.executeCommandById(
					"open-with-default-app:open"
				);
				// console.log( this.app.commands.app.commands.commands);
				// Write in a new markdown file
				// this.app.vault.create("New note.md", this.app.commands.app.commands.commands);
				// write the json as a string to a file
				const commands = this.app.commands.app.commands.commands;
				// make it so we can map over it

				console.log(
					JSON.stringify(this.app.commands.app.commands.commands)
				);
				this.app.vault.create(
					"New note.md",
					JSON.stringify(this.app.commands.app.commands.commands)
				);
			}
		);
		this.app.workspace.on("active-leaf-change", () => {
			console.log("Active leaf changed!");
			// get current leaf
			const leaf = this.app.workspace.activeLeaf;
			// get current view
			const view = leaf.view;
			// console.log(view);
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile?.extension === "pdf") {
				console.log("PDF file opened!");
				//  find HTML element with class 'markdown-preview-sizer'
				// get Document
				const doc = view.containerEl.ownerDocument;
				console.log(doc);
				const toolbars =
					document.getElementsByClassName("pdf-toolbar");
				//  Loop through all the elements with class 'markdown-preview-sizer'
				for (let i = 0; i < toolbars.length; i++) {
					//  check if it has a child with id 'annotate'
					if (
						!toolbars[i].contains(
							document.getElementById("annotate"+i)
						)
					) {
						// add a child inside markdownPreviewSizer
						const button = doc.createElement("button");
						// give it an id of 'annotate' + i
						button.id = "annotate"+i;
						button.innerHTML = "Annotate";
						button.onclick = () => {
							this.app.commands.executeCommandById(
								"open-with-default-app:open"
							);
						};
						toolbars[i].appendChild(button);
					}
				};
				// else if md check if there are embedded pdfs
			}
			//  else if (activeFile?.extension === "md") {
			// 	const embededPdfs = document.getElementsByClassName("pdf-embed");
			// 	// Loop through all the elements with class 'pdf-embed' foreach does not work
			// 	for (let i = 0; i < embededPdfs.length; i++) {
			// 		// get its child pdf-toolbar
			// 		const toolbar = embededPdfs[i].getElementsByClassName(
			// 			"pdf-toolbar"
			// 		)[0];
			// 		if (!toolbar) continue;
			// 		if (embededPdfs[i].contains(
			// 			document.getElementById("annotate"+i)
			// 		)) continue;

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
	onLayoutReady() {}

	onunload() {}
}
