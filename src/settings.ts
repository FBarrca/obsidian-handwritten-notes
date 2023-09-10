// Obsidian imports
import {
  App,
  Setting,
  PluginSettingTab,
  ButtonComponent,
  Platform,
  MarkdownRenderer,
} from "obsidian";

import {
  DEFAULT_ASSET_PATH,
  DEFAULT_TEMPLATE,
  TEMPLATE_DIR,
} from "./utils/constants";
import { PluginSettings } from "./utils/types";
// Local imports
import { AppWithDesktopInternalApi } from "./utils/helpers";

import NotePDF from "./main";

export class NotePDFSettingsTab extends PluginSettingTab {
  private readonly plugin: NotePDF;

  constructor(app: App, plugin: NotePDF) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl: modal } = this;
    modal.empty();
    // GENERAL SETTINGS
    modal.createEl("h2", {
      text: "General Settings",
    });
    this.CollapseEmbedsToggle();
    // Generate new note
    modal.createEl("h2", {
      text: "Create new note",
    });
    this.createRelativePathToggle();
    this.createDefaultPathTextInput();

    // TEMPLATES
    this.createTemplatesSection();
    this.createSettingWithOptions();
  }

  private CollapseEmbedsToggle(): void {
    new Setting(this.containerEl)
      .setName("Collapse embeds")
      .setDesc("Collapse embeds by default to save vertical space.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.collapseEmbeds)
          .onChange(async (value) => {
            this.plugin.settings.collapseEmbeds = value;
            await this.plugin.saveSettings();
          })
      );
  }
  private createRelativePathToggle(): void {
    new Setting(this.containerEl)
      .setName("Use relative path")
      .setDesc("Use relative path for the template path.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useRelativePaths)
          .onChange(async (value) => {
            this.plugin.settings.useRelativePaths = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private createDefaultPathTextInput(): void {
    new Setting(this.containerEl)
      .setName("Default Path for new notes")
      .setDesc("Path to be used if relative path is disabled.")
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_ASSET_PATH)
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
    MarkdownRenderer.render(
      this.app,
      `You can use **any** PDF as a template for the notes. Just add it to the templates folder and it will appear here. 
      \`${this.plugin.manifest.dir + TEMPLATE_DIR}\``,
      this.containerEl,
      "",
      this.plugin
    );
    this.containerEl.createEl("p", {
      text: "",
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
