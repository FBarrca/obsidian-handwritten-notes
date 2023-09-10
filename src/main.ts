// Obsidian imports
import {
  ButtonComponent,
  MarkdownView,
  Notice,
  Platform,
  Plugin,
  TFile,
  TFolder,
  normalizePath,
} from "obsidian";

// Local imports
import { PDFCreatorModal } from "./dialogs/CreatorModal";
import { NotePDFSettingsTab } from "./settings";
import { DEFAULT_SETTINGS, TEMPLATE_DIR } from "./utils/constants";
import {
  FileExistsError,
  PluginSettings,
  TemplateNotFoundError,
} from "./utils/types";
import {
  loadPdfTemplate,
  createBinaryFile,
  openCreatedFile,
  appendAnnotateButton,
  initTemplatesFolder,
  fileExists,
} from "./utils/utils";
import {
  AppWithDesktopInternalApi,
  FileSystemAdapterWithInternalApi,
} from "./utils/helpers";
import WelcomeModal from "./dialogs/WelcomeModal";

export default class NotePDF extends Plugin {
  settings: PluginSettings;

  // Lifecycle methods
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new NotePDFSettingsTab(this.app, this));

    this.addRibbonIcon("pencil", "Create empty handwritten note", async () => {
      const path = await this.createPDFwithModal();
      openCreatedFile(this.app, path);
    });

    this.addCommand({
      id: "modal-create-open",
      name: "Modal: Create and open an empty handwritten note",
      editorCallback: async () => {
        const filePath = await this.createPDFwithModal();
        openCreatedFile(this.app, filePath);
      },
    });
    this.addCommand({
      id: "modal-create-embed",
      name: "Modal: Create and embed an empty handwritten note",
      editorCallback: async () => {
        const filePath = await this.createPDFwithModal();
        const editor =
          this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        if (editor) {
          editor.replaceSelection(`![[${filePath}]]`);
        }
      },
    });
    this.addCommand({
      id: "quick-create-embed",
      name: "Create and embed from favorite template",
      editorCallback: async () => {
        const destFolder = this.getDestFolder();
        // Parent file + note + timestamp in date format with time
        const fileName = `${
          this.app.workspace.getActiveFile()?.basename
        }-note-${
          new Date().toISOString().split("T")[0]
        }-${new Date().getHours()}-${new Date().getMinutes()}-${new Date().getSeconds()}`;
        const filePath = await this.createPDF(
          fileName,
          destFolder,
          this.settings.favoriteTemplate
        );
        // insert the path at the cursor
        const editor =
          this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        if (editor) {
          editor.replaceSelection(`![[${filePath}]]`);
        }
      },
    });

    this.addCommand({
      id: "quick-create-embed-open",
      name: "Create and embed and open from favorite template",
      editorCallback: async () => {
        const destFolder = this.getDestFolder();
        // Parent file + note + timestamp in date format with time
        const fileName = `${
          this.app.workspace.getActiveFile()?.basename
        }-note-${
          new Date().toISOString().split("T")[0]
        }-${new Date().getHours()}-${new Date().getMinutes()}-${new Date().getSeconds()}`;
        const filePath = await this.createPDF(
          fileName,
          destFolder,
          this.settings.favoriteTemplate
        );
        // insert the path at the cursor
        const editor =
          this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        if (editor) {
          editor.replaceSelection(`![[${filePath}]]`);
        }

        // openCreatedFile(this.app, filePath);
        // get TFile from path
        const pdfFile = await this.app.vault.getAbstractFileByPath(filePath);
        if (!pdfFile) return;
        await this.openEmbeddedExternal(pdfFile as TFile);
      },
    });

    this.app.workspace.onLayoutReady(() => {
      this.addAnnotateButton();
      initTemplatesFolder(this);
      this.registerInterval(
        window.setInterval(this.addAnnotateButton.bind(this), 1000)
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

  // PDF creation methods
  async createPDFwithModal(): Promise<string> {
    const { app } = this;

    return new Promise<string>((resolve, reject) => {
      new PDFCreatorModal(
        app,
        this.manifest,
        this.settings.favoriteTemplate,
        async (result) => {
          try {
            let destFolder = this.getDestFolder();

            if (destFolder) {
              const { template, name } = result;
              const path = await this.createPDF(name, destFolder, template);

              // Resolve the promise with the path when done
              resolve(path);
            } else {
              // No destination folder found
              reject(new Error("No destination folder found."));
            }
          } catch (error) {
            // Reject the promise if any errors occur
            reject(error);
          }
        }
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
    templateName: string
  ): Promise<string> {
    const filePath = normalizePath(`${path}/${name}.pdf`);

    // check if the file already exists
    if (this.app.vault.getAbstractFileByPath(filePath)) {
      throw new FileExistsError("File already exists!");
    }

    const templatePath = normalizePath(
      `${this.manifest.dir}/${TEMPLATE_DIR}/${templateName}`
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
  getDestFolder(): string {
    const { app } = this;
    if (this.settings.useRelativePaths) {
      const parentPath = app.workspace.getActiveFile()?.parent?.path;
      // maybe no file is open, for now just return the root
      if (!parentPath) return app.vault.getRoot().path;
      return parentPath;
      // Using a template folder
    } else {
      const templateFolderPath = normalizePath(this.settings.templatePath);
      // Check if the template folder exists
      if (app.vault.getAbstractFileByPath(templateFolderPath)) {
        return templateFolderPath;
      } else {
        // Create the template folder if it doesn't exist
        app.vault.createFolder(templateFolderPath);
        new Notice("Template folder not found. Creating folder.");
        return templateFolderPath;
      }
    }
  }

  // Annotation button methods
  async addAnnotateButton() {
    const activeView = this.app.workspace.activeLeaf.view;
    if (!activeView) return;
    if (activeView.getViewType() === "pdf") {
      await this.addAnnotateButtonPDF();
    } else if (activeView.getViewType() === "markdown") {
      this.addAnnotateButtonMarkdown();
    }
  }

  async addAnnotateButtonPDF() {
    const toolbars = document.getElementsByClassName("pdf-toolbar");
    for (let i = 0; i < toolbars.length; i++) {
      appendAnnotateButton(toolbars[i] as HTMLElement, () =>
        //@ts-ignore
        this.app.commands.executeCommandById("open-with-default-app:open")
      );
    }
  }

  async addAnnotateButtonMarkdown() {
    const pdfEmbeds = document.querySelectorAll(".pdf-embed");
    for (const [index, embed] of Array.from(pdfEmbeds).entries()) {
      let pdfFile: TFile;
      const pdfLink = embed.getAttribute("src");
      const currentNotePath = this.app.workspace.getActiveFile().path;
      pdfFile = this.app.metadataCache.getFirstLinkpathDest(
        pdfLink,
        currentNotePath
      );

      let rightToolbar = embed.querySelector(".pdf-toolbar-right");
      if (!rightToolbar) return;
      appendAnnotateButton(rightToolbar as HTMLElement, async () => {
        await this.openEmbeddedExternal(pdfFile);
      });
      // COLLAPSE BUTTON
      const pdfContainer = embed.querySelector(".pdf-container");
      // const rightToolbar = embed.querySelector(".pdf-toolbar-left");
      // if (!rightToolbar) return;
      // Add a button to control a css variable that controls the colapsed flag

      const hasCollapseButton = embed.querySelector(".pdf-collapse-button");
      if (hasCollapseButton) return;
      const collapseButton = new ButtonComponent(
        rightToolbar as HTMLElement
      ).setIcon("double-down-arrow-glyph");
      collapseButton.setTooltip("Collapse document");
      collapseButton.setClass("pdf-collapse-button");
      collapseButton.setClass("clickable-icon");
      collapseButton.onClick(async () => {
        const isCollapsed = embed.classList.contains("pdf-embed-collapsed");

        // Toggle the class
        embed.classList.toggle("pdf-embed-collapsed");
        pdfContainer.classList.toggle("pdf-embed-collapsed");

        // Update the icon and tooltip based on the toggled state
        if (isCollapsed) {
          collapseButton.setIcon("double-up-arrow-glyph");
          collapseButton.setTooltip("Collapse document");
          embed.toggleClass("pdf-embed-collapsed", false);
          pdfContainer.toggleClass("pdf-embed-collapsed", false);
        } else {
          collapseButton.setIcon("double-down-arrow-glyph"); // Assuming you have an icon named double-up-arrow-glyph for the expanded state
          collapseButton.setTooltip("Expand document");
          embed.toggleClass("pdf-embed-collapsed", true);
          pdfContainer.toggleClass("pdf-embed-collapsed", true);
        }
      });
    }
  }

  // Miscellaneous methods
  async openEmbeddedExternal(pdfFile: TFile) {
    if (Platform.isDesktop) {
      await (this.app as AppWithDesktopInternalApi).openWithDefaultApp(
        pdfFile.path
      );
    } else {
      await (this.app.vault.adapter as FileSystemAdapterWithInternalApi).open(
        pdfFile.path
      );
    }
  }
}
