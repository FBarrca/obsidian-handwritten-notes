// Obsidian imports
import {
  App,
  Setting,
  PluginSettingTab,
  ButtonComponent,
  Platform,
} from "obsidian";

// Local imports
import { AppWithDesktopInternalApi } from "./utils/helpers";

import NotePDF from "./main";

interface PluginSettings {
  templatePath: string;
  assetUrl: string;
  useRelativePaths: boolean;
  openNewNote: boolean;
  showWelcomeModal: boolean;
  favoriteTemplate: string;
}

const TEMPLATE_DIR = "/templates/";

const DEFAULT_TEMPLATE = "blank.pdf";

const DEFAULT_SETTINGS: PluginSettings = {
  templatePath: "/handwritten-notes/",
  assetUrl: "",
  useRelativePaths: false,
  openNewNote: true,
  showWelcomeModal: true,
  favoriteTemplate: DEFAULT_TEMPLATE,
};

class NotePDFSettingsTab extends PluginSettingTab {
  private readonly plugin: NotePDF;

  constructor(app: App, plugin: NotePDF) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.createSettingsHeader();
    this.createRelativePathToggle();
    this.createDefaultPathTextInput();
    this.createOpenNewNoteToggle();
    this.createTemplatesSection();
    // make a scrollable container for the templates

    this.createSettingWithOptions();
  }

  private createSettingsHeader(): void {
    this.containerEl.createEl("h2", {
      text: "Create new note",
    });
  }

  private createOpenNewNoteToggle(): void {
    new Setting(this.containerEl)
      .setName("Open new note")
      .setDesc("Open new note after creating it.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.openNewNote)
          .onChange((value) => (this.plugin.settings.openNewNote = value))
      );
  }

  private createRelativePathToggle(): void {
    new Setting(this.containerEl)
      .setName("Use relative path")
      .setDesc("Use relative path for the template path.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useRelativePaths)
          .onChange((value) => (this.plugin.settings.useRelativePaths = value))
      );
  }

  private createDefaultPathTextInput(): void {
    new Setting(this.containerEl)
      .setName("Default Path for new notes")
      .setDesc("Path to be used if relative path is disabled.")
      .addText((text) =>
        text
          .setPlaceholder("/handwritten-notes/")
          .setValue(this.plugin.settings.templatePath)
          .onChange(async (value) => {
            this.plugin.settings.templatePath = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private createTemplatesSection(): void {
    const titleEl = this.containerEl.createEl("h2", { text: "Templates" });

    if (Platform.isDesktop) {
      this.createFolderButton(titleEl);
    }

    this.containerEl.createEl("p", {
      text: "You can use any PDF as a template for the notes. Here are some examples:",
    });
  }

  private createFolderButton(parentEl: HTMLElement): void {
    const folderButton = new ButtonComponent(parentEl)
      .setIcon("folder")
      .setClass("settings-button")
      .setClass("settings-folder-button")
      .setTooltip("Open templates folder in the explorer");
    folderButton.onClick(() => {
      (this.app as AppWithDesktopInternalApi).showInFolder(
        this.plugin.manifest.dir + TEMPLATE_DIR + DEFAULT_TEMPLATE
      );
    });
    // Reload button
    const reloadButton = new ButtonComponent(parentEl)
      .setIcon("sync")
      .setClass("settings-button")
      .setClass("settings-folder-button")
      .setTooltip("Reload templates");
    reloadButton.onClick(() => {
      this.display();
    });
  }

  private async createSettingWithOptions(): Promise<void> {
    const { containerEl } = this;

    const scrollContainer = containerEl.createDiv();
    scrollContainer.addClass("settings-scroll-container");

    // Show also templates in the templates folder
    const templatePath = this.plugin.manifest.dir + TEMPLATE_DIR;
    const templates = await this.app.vault.adapter.list(templatePath);
    console.log(templates);
    // iterate over the templates and show them
    for (const filePath of templates.files) {
      const fileName = filePath.split("/").pop();
      // fileName without extension and capitalized
      const title = fileName
        ?.split(".")[0]
        .replace(/-/g, " ")
        .replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));
      const setting = new Setting(scrollContainer)
        .setName(title)
        .setDesc(fileName);

      this.favoriteButton(setting, fileName);
      // Delete button and lock for default template
      this.deleteButton(setting, filePath, fileName);
    }
  }

  private deleteButton(
    setting: Setting,
    filePath: string,
    fileName: string
  ): void {
    // Default file cant be deleted
    if (fileName === DEFAULT_TEMPLATE) {
      // Add a lock icon
      setting.addButton((button) =>
        button
          .setIcon("lock")
          .setTooltip("Default template")
          .setClass("settings-button")
          .setClass("settings-folder-button")
      );
    } else {
      setting.addButton((button) =>
        button
          .setIcon("trash")
          .setTooltip("Delete template")
          .setClass("settings-button")
          .onClick(async () => {
            // Check if the template is the favorite template
            if (this.isDefaultTemplate(fileName))
              this.plugin.settings.favoriteTemplate = DEFAULT_TEMPLATE;
            try {
              await this.app.vault.adapter.remove(filePath);
              console.log(`Deleted asset: ${filePath}`);
              this.display();
            } catch (err) {
              console.error(`Error deleting asset ${filePath}:`, err);
            }
          })
      );
    }
  }
  private isDefaultTemplate(fileName: string): boolean {
    return fileName === this.plugin.settings.favoriteTemplate;
  }

  private favoriteButton(setting: Setting, fileName: string): void {
    setting.addButton((button) =>
      button
        .setIcon(
          this.plugin.settings.favoriteTemplate === fileName
            ? "star"
            : "crossed-star"
        )
        .setTooltip("Favorite template")
        .setClass("settings-button")
        .onClick(() => {
          // if the template is not favorite, make it favorite else do nothing
          if (this.isDefaultTemplate(fileName)) return;
          this.plugin.settings.favoriteTemplate = fileName;
          this.plugin.saveSettings();
          // refresh the settings tab
          this.display();
        })
    );
  }
}

export { NotePDFSettingsTab, DEFAULT_SETTINGS, PluginSettings };
