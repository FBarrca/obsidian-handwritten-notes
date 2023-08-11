import {
  Notice,
  Platform,
  Plugin,
  TFile,
  TFolder,
  normalizePath,
} from "obsidian";
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
import {
  AppWithDesktopInternalApi,
  FileSystemAdapterWithInternalApi,
} from "./utils/helpers";

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
      this.registerInterval(
        window.setInterval(this.addAnnotateButton.bind(this), 1000)
      );
    });
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
      appendAnnotateButton(toolbars[i] as HTMLElement, i, () =>
        //@ts-ignore
        app.commands.executeCommandById("open-with-default-app:open")
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

      let toolbar = embed.querySelector(".pdf-toolbar");
      if (!toolbar) return;
      appendAnnotateButton(toolbar as HTMLElement, index, async () => {
        await this.openEmbeddedPDF(pdfFile);
      });
    }
  }

  async openEmbeddedPDF(pdfFile: TFile) {
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
