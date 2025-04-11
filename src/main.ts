// Obsidian imports
import {
	ButtonComponent,
	type Editor,
	MarkdownView,
	Notice,
	Platform,
	Plugin,
	type TFile,
	type View,
	normalizePath,
} from "obsidian";

// Local imports
import { PDFCreatorModal } from "./dialogs/CreatorModal";
import { ChooseDestModals } from "./dialogs/PathModals";
import WelcomeModal from "./dialogs/WelcomeModal";
import { NotePDFSettingsTab } from "./settings";
import { DEFAULT_SETTINGS } from "./utils/constants";
import type {
	AppWithDesktopInternalApi,
	FileSystemAdapterWithInternalApi,
} from "./utils/helpers";
import {
	FileExistsError,
	type PluginSettings,
	TemplateNotFoundError,
} from "./utils/types";
import {
	appendAnnotateButton,
	createBinaryFile,
	fileExists,
	getTemplatesFolder,
	initTemplatesFolder,
	loadPdfTemplate,
	openCreatedFile,
} from "./utils/utils";

export default class NotePDF extends Plugin {
	settings: PluginSettings;

	async quickCreate(dest?: string) {
		const destFolder = dest ?? (await this.getDestFolder());
		// Parent file + note + timestamp in date format with time
		const fileName = `${this.app.workspace.getActiveFile()?.basename}-note-${
			new Date().toISOString().split("T")[0]
		}-${new Date().getHours()}-${new Date().getMinutes()}-${new Date().getSeconds()}`;
		return await this.createPDF(
			fileName,
			destFolder,
			this.settings.favoriteTemplate,
		);
	}

	// Lifecycle methods
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new NotePDFSettingsTab(this.app, this));

		/** CREATE FROM MODAL */
		this.addRibbonIcon("pencil", "Create empty handwritten note", async () => {
			const path = await this.createPDFwithModal({ chooseDest: true });
			await openCreatedFile(this.app, path);
		});

		this.addCommand({
			id: "modal-create-open",
			name: "Modal: Create and open an empty handwritten note",
			callback: async () => {
				const editor =
					this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
				const filePath = await this.createPDFwithModal({
					chooseDest: true,
					inEditor: !!editor,
				});
				await openCreatedFile(this.app, filePath);
			},
		});

		this.addCommand({
			id: "modal-create-embed",
			name: "Modal: Create and embed an empty handwritten note",
			editorCallback: async (editor: Editor) => {
				const filePath = await this.createPDFwithModal({
					chooseDest: true,
					inEditor: true,
				});
				editor.replaceSelection(`![[${filePath}]]`);
			},
		});

		/** QUICK CREATE FROM FAVORITE **/

		this.addCommand({
			id: "create-favorite",
			name: "Create from favorite template",
			callback: async () => {
				await this.quickCreate();
			},
		});

		this.addCommand({
			id: "quick-create-embed",
			name: "Create and embed from favorite template",
			editorCallback: async (editor: Editor) => {
				const filePath = await this.quickCreate();
				editor.replaceSelection(`![[${filePath}]]`);
			},
		});

		this.addCommand({
			id: "quick-create-embed-open",
			name: "Create and embed and open from favorite template",
			editorCallback: async (editor: Editor) => {
				const filePath = await this.quickCreate();
				// insert the path at the cursor

				editor.replaceSelection(`![[${filePath}]]`);

				// openCreatedFile(this.app, filePath);
				// get TFile from path
				const pdfFile = this.app.vault.getAbstractFileByPath(filePath);
				if (!pdfFile) return;
				await this.openEmbeddedExternal(pdfFile as TFile);
			},
		});

		this.addCommand({
			id: "quick-create-choose-dest",
			name: "Quick create and choose destination from modal",
			callback: async () => {
				await this.quickCreateWithDest();
			},
		});

		this.addCommand({
			id: "quick-create-choose-dest-embed",
			name: "Quick create and choose destination from modal and embed",
			editorCallback: async (editor) => {
				await this.quickCreateWithDest(editor);
			},
		});

		this.app.workspace.onLayoutReady(() => {
			this.addAnnotateButton();
			initTemplatesFolder(this);
			this.registerInterval(
				window.setInterval(this.addAnnotateButton.bind(this), 100),
			);
		});
		// Show welcome modal
		if (this.settings.showWelcomeModal) {
			new WelcomeModal(this.app, this).open();
			this.settings.showWelcomeModal = false;
			await this.saveSettings();
		}
	}

	// Settings methods
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async quickCreateWithDest(editor?: Editor) {
		new ChooseDestModals(this.app, async (result) => {
			const dest = result.path;
			const filePath = await this.quickCreate(dest);
			if (editor) editor.replaceSelection(`![[${filePath}]]`);
			await openCreatedFile(this.app, filePath);
		}).open();
	}

	// PDF creation methods
	async createPDFwithModal(options: {
		chooseDest?: boolean;
		inEditor?: boolean;
	}): Promise<string> {
		const { chooseDest = false, inEditor = false } = options;
		const templatesFolder = await getTemplatesFolder(this);
		return new Promise<string>((resolve, reject) => {
			new PDFCreatorModal(
				this,
				templatesFolder,
				async (result) => {
					const destFolder = result.path ?? (await this.getDestFolder());
					console.info("Creating PDF", result);
					try {
						const { template, name } = result;
						const path = await this.createPDF(name, destFolder, template);
						// Resolve the promise with the path when done
						resolve(path);
					} catch (error) {
						// Reject the promise if any errors occur
						reject(error);
					}
				},
				chooseDest,
				inEditor,
			).open();
		});
	}

	/**
	 * Asynchronously creates a PDF using a given template.
	 *
	 * @param name - Name of the PDF file to be created.
	 * @param path - Directory path where the PDF will be stored.
	 * @param templateName - Name of the template to be used for creating the PDF.
	 * @returns Promise resolving to the file path of the created PDF.
	 */
	async createPDF(
		name: string,
		path: string,
		templateName: string,
	): Promise<string> {
		const filePath = normalizePath(`${path}/${name}.pdf`);

		// check if the file already exists
		if (this.app.vault.getAbstractFileByPath(filePath)) {
			throw new FileExistsError("File already exists!");
		}

		const templatePath = normalizePath(
			`${await getTemplatesFolder(this)}/${templateName}`,
		);
		if (!(await fileExists(this.app, templatePath))) {
			throw new TemplateNotFoundError("Template file not found!");
		}

		const template = await loadPdfTemplate(this.app, templatePath);
		await createBinaryFile(this.app, template, filePath);

		return filePath;
	}

	/**
	 * Returns the destination folder to be used for saving the PDF.
	 *
	 * If the setting for using relative paths is enabled, the destination folder will be the same as the current note.
	 * Otherwise, the destination folder will be the template folder.
	 * @returns File path of the destination folder to be used for saving the PDF.
	 */
	async getDestFolder(): Promise<string> {
		const { app } = this;
		if (this.settings.useRelativePaths) {
			const parentPath = app.workspace.getActiveFile()?.parent?.path;
			// maybe no file is open, for now just return the root
			if (!parentPath) {
				if (
					this.settings.defaultPath.trim() === "" ||
					this.settings.defaultPath.trim() === "/"
				)
					return app.vault.getRoot().path;
				return this.settings.defaultPath;
			}
			return parentPath;
		}
		const defaultFolderPath = normalizePath(this.settings.defaultPath); // Check if the template folder exists
		if (app.vault.getAbstractFileByPath(defaultFolderPath)) {
			return defaultFolderPath;
		}
		// Create the template folder if it doesn't exist
		await app.vault.createFolder(defaultFolderPath);
		new Notice("Template folder not found. Creating folder.");
		return defaultFolderPath;
	}

	// Annotation button methods
	async addAnnotateButton() {
		// All the views of type markdown
		const markdownViews = this.app.workspace.getLeavesOfType("markdown");
		for (const view of markdownViews) {
			await this.addAnnotateButtonMarkdown(view.view as MarkdownView);
		}
		// pdf views
		const pdfViews = this.app.workspace.getLeavesOfType("pdf");
		for (const view of pdfViews) {
			await this.addAnnotateButtonPDF(view.view as View);
		}
	}

	async addAnnotateButtonPDF(view: View) {
		// get the
		const toolbars = view.containerEl.getElementsByClassName("pdf-toolbar");
		for (let i = 0; i < toolbars.length; i++) {
			appendAnnotateButton(toolbars[i] as HTMLElement, () =>
				//@ts-ignore
				this.app.commands.executeCommandById("open-with-default-app:open"),
			);
		}
	}

	async addAnnotateButtonMarkdown(markdownView: View) {
		// get the html that can be edited
		const markdownContainer = markdownView.containerEl;

		const pdfEmbeds = markdownContainer.querySelectorAll(".pdf-embed");
		// Convert the NodeList to an array

		for (const embed of Array.from(pdfEmbeds)) {
			const pdfLink = embed.getAttribute("src");
			const currentNotePath = this.app.workspace.getActiveFile().path;
			const pdfFile = this.app.metadataCache.getFirstLinkpathDest(
				pdfLink,
				currentNotePath,
			);
			const rightToolbar = embed.querySelector(".pdf-toolbar-right");
			if (!rightToolbar) continue;
			appendAnnotateButton(rightToolbar as HTMLElement, async () => {
				await this.openEmbeddedExternal(pdfFile);
			});

			// COLLAPSE BUTTON
			const leftToolbar = embed.querySelector(".pdf-toolbar-left");
			if (!leftToolbar) continue;
			const pdfContainer = embed.querySelector(".pdf-container");

			const hasCollapseButton = embed.querySelector(".pdf-collapse-button");
			if (hasCollapseButton) continue;

			const collapseButton = new ButtonComponent(rightToolbar as HTMLElement);
			collapseButton.setClass("pdf-collapse-button");
			collapseButton.setClass("clickable-icon");
			this.settings.collapseEmbeds
				? this.expandEmbed(embed, pdfContainer, leftToolbar, collapseButton)
				: this.collapseEmbed(embed, pdfContainer, leftToolbar, collapseButton);

			collapseButton.onClick(async () => {
				const isCollapsed = embed.classList.contains("pdf-embed-collapsed");

				// Toggle the class
				embed.classList.toggle("pdf-embed-collapsed");
				pdfContainer.classList.toggle("pdf-container-collapsed");

				// Update the icon and tooltip based on the toggled state
				if (isCollapsed) {
					collapseButton.setIcon("double-up-arrow-glyph");
					collapseButton.setTooltip("Collapse document");
					embed.toggleClass("pdf-embed-collapsed", false);
					pdfContainer.toggleClass("pdf-container-collapsed", false);
					leftToolbar.toggleClass("pdf-toolbar-left-collapsed", false);
				} else {
					collapseButton.setIcon("double-down-arrow-glyph"); // Assuming you have an icon named double-up-arrow-glyph for the expanded state
					collapseButton.setTooltip("Expand document");
					embed.toggleClass("pdf-embed-collapsed", true);
					pdfContainer.toggleClass("pdf-container-collapsed", true);
					leftToolbar.toggleClass("pdf-toolbar-left-collapsed", true);
				}
			});
			// ADD NAME to the view
			// name is the last part of the path without the extension
			const pdfName = pdfLink.split("/").pop()?.split(".")[0];
			const pdfNameButton = new ButtonComponent(rightToolbar as HTMLElement);
			pdfNameButton.buttonEl.addClasses([
				"pdf-page-numbers",
				"pdf-name",
				"clickable-icon",
			]);
			const toolbar = embed.querySelector(".pdf-toolbar");
			pdfNameButton.setButtonText(pdfName);
			pdfNameButton.setTooltip("Open link");
			toolbar.insertBefore(pdfNameButton.buttonEl, rightToolbar);
			pdfNameButton.onClick(async () => {
				await openCreatedFile(this.app, pdfLink);
			});
		}
	}

	collapseEmbed(
		embed: Element,
		pdfContainer: Element,
		leftToolbar: Element,
		collapseButton: ButtonComponent,
	) {
		collapseButton.setIcon("double-up-arrow-glyph");
		collapseButton.setTooltip("Collapse document");
		embed.toggleClass("pdf-embed-collapsed", false);
		pdfContainer.toggleClass("pdf-container-collapsed", false);
		leftToolbar.toggleClass("pdf-toolbar-left-collapsed", false);
	}

	expandEmbed(
		embed: Element,
		pdfContainer: Element,
		leftToolbar: Element,
		collapseButton: ButtonComponent,
	) {
		collapseButton.setIcon("double-down-arrow-glyph"); // Assuming you have an icon named double-up-arrow-glyph for the expanded state
		collapseButton.setTooltip("Expand document");
		embed.toggleClass("pdf-embed-collapsed", true);
		pdfContainer.toggleClass("pdf-container-collapsed", true);
		leftToolbar.toggleClass("pdf-toolbar-left-collapsed", true);
	}

	// Miscellaneous methods
	async openEmbeddedExternal(pdfFile: TFile) {
		if (Platform.isDesktop) {
			await (this.app as AppWithDesktopInternalApi).openWithDefaultApp(
				pdfFile.path,
			);
		} else {
			await (this.app.vault.adapter as FileSystemAdapterWithInternalApi).open(
				pdfFile.path,
			);
		}
	}
}
