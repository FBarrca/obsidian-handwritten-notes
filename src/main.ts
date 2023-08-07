import { Notice, Plugin, TFolder, normalizePath } from "obsidian";
import { PDFCreatorModal } from "./CreatorModal";
import {
  loadPdfTemplate,
  createBinaryFile,
  openCreatedFile,
  appendAnnotateButton,
  initTemplatesFolder,
} from "./utils/utils";

import {
  MyPluginSettingTab,
  PluginSettings,
  DEFAULT_SETTINGS,
} from "./settings";

export default class NotePDF extends Plugin {
  settings: PluginSettings;
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MyPluginSettingTab(this.app, this));

    const { app } = this;
    this.addRibbonIcon("pencil", "Create empty handwritten note", () =>
      this.createPDF()
    );

    this.addCommand({
      id: "create-empty-pdf-note",
      name: "Create and open an empty handwritten note",
      editorCallback: () => this.createPDF(),
    });

    // PDF Annotate button
    this.app.workspace.onLayoutReady(() => {
      this.addAnnotateButton();
      initTemplatesFolder(this);
    });
    app.workspace.on("active-leaf-change", () => this.addAnnotateButton());
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async createPDF(): Promise<void> {
    const { app } = this;
    new PDFCreatorModal(app, this.manifest, async (result) => {
      let destFolder =
        app.workspace.getActiveFile()?.parent || app.vault.getRoot();
      console.log(`Using relative paths: ${this.settings.useRelativePaths}`);
      if (!this.settings.useRelativePaths) {
        const templateFolder = this.app.vault.getAbstractFileByPath(
          normalizePath(this.settings.templatePath)
        );
        // if (templateFolder instanceof TFolder) opposite of instanceof
        if (templateFolder == null || !(templateFolder instanceof TFolder)) {
          await this.app.vault.createFolder(
            normalizePath(this.settings.templatePath)
          );

          new Notice("Template folder not found. Creating folder.");
        }
        destFolder = templateFolder as TFolder;
      }

      if (destFolder) {
        const { template, name } = result;

        const path = normalizePath(`${destFolder.path}/${name}.pdf`);
        const templatePath = this.manifest.dir + "/templates/" + template;
        await createBinaryFile(
          app,
          await loadPdfTemplate(app, templatePath),
          path
        );
        // alternativepath

        openCreatedFile(app, path);
      }
    }).open();
  }

  addAnnotateButton() {
    const active_view = this.app.workspace.activeLeaf.view;
    if (!active_view || active_view.getViewType() !== "pdf") return;

    // Find HTML element with class 'pdf-toolbar'
    const toolbars = document.getElementsByClassName("pdf-toolbar");

    // Loop through all the elements with class 'pdf-toolbar'
    for (let i = 0; i < toolbars.length; i++) {
      appendAnnotateButton(toolbars[i] as HTMLElement, i, this.app);
    }
  }
}
