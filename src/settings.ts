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
import { downloadFile, fileExists } from "./utils/utils";
import NotePDF from "./main";

interface Option {
  name: string;
  desc: string;
  fileName: string;
  downloadUrl: string;
  isDefault: boolean;
  isFavorite: boolean;
}

interface PluginSettings {
  templatePath: string;
  assetUrl: string;
  useRelativePaths: boolean;
  openNewNote: boolean;
  showWelcomeModal: boolean;
  favoriteTemplate: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
  templatePath: "/handwritten-notes/",
  assetUrl: "",
  useRelativePaths: false,
  openNewNote: true,
  showWelcomeModal: true,
  favoriteTemplate: "blank.pdf",
};

const TEMPLATE_DIR = "/templates/";

const SETTINGS_OPTIONS: Option[] = [
  {
    name: "Blank",
    fileName: "blank.pdf",
    desc: "A blank template. (Default)",
    downloadUrl: "",
    isDefault: true,
    isFavorite: true,
  },
  {
    name: "Lined",
    fileName: "lined.pdf",
    desc: "A 5mm lined A4",
    downloadUrl:
      "https://www.inksandpens.com/content/files/paper-templates/A4%20Lined%205mm.pdf",
    isDefault: false,
    isFavorite: false,
  },
  {
    name: "Canvas",
    fileName: "canvas.pdf",
    desc: "A blank A0 for virtual whiteboard use",
    downloadUrl: "https://www.a0-size.com/download/118/?tmstv=1691357093",
    isDefault: false,
    isFavorite: false,
  },
];

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
    const folderButton = new ButtonComponent(parentEl).setIcon("folder");
    folderButton.buttonEl.classList.add("settings-folder-button");

    folderButton.onClick(() => {
      (this.app as AppWithDesktopInternalApi).showInFolder(
        this.plugin.manifest.dir + TEMPLATE_DIR + "blank.pdf"
      );
    });
  }

  private async createSettingWithOptions(): Promise<void> {
    for (const option of SETTINGS_OPTIONS) {
      const setting = new Setting(this.containerEl)
        .setName(option.name)
        .setDesc(option.desc);

      const templatePath =
        this.plugin.manifest.dir + TEMPLATE_DIR + option.fileName;

      // DOWNLOAD/ DELETE BUTTON and FAVORITE BUTTON
      if (await fileExists(this.app, templatePath)) {
        // If the template exists, show a delete button and a favorite button
        this.favoriteButton(setting, option);
        if (option.isDefault) continue;
        setting.addButton((button) =>
          button.setIcon("trash").onClick(async () => {
            // Check if the template is the favorite template
            if (option.fileName === this.plugin.settings.favoriteTemplate) {
              // Make the default template favorite
              const defaultTemplate = SETTINGS_OPTIONS.find(
                (option) => option.isDefault
              );
              if (defaultTemplate) {
                defaultTemplate.isFavorite = true;
                this.plugin.settings.favoriteTemplate =
                  defaultTemplate.fileName;
              }
              await this.deleteAsset(option);
            }
          })
        );
      } else {
        if (option.isDefault) continue;
        setting.addButton((button) =>
          button
            .setIcon("install")
            .onClick(async () => await this.downloadAsset(option, templatePath))
        );
      }
    }
  }

  private favoriteButton(setting: Setting, option: Option): void {
    setting.addButton((button) =>
      button
        .setIcon(option.isFavorite ? "star" : "crossed-star")
        .onClick(() => {
          console.log(`Favorite button clicked for ${option.name}`);
          console.log(`Is favorite: ${option.isFavorite}`);
          // if the template is not favorite, make it favorite else do nothing
          if (option.isFavorite) return;
          // remove the favorite icon from the previous favorite template
          const previousFavoriteTemplate = SETTINGS_OPTIONS.find(
            (option) => option.isFavorite
          );
          if (previousFavoriteTemplate) {
            previousFavoriteTemplate.isFavorite = false;
          }
          // make the current template favorite
          option.isFavorite = true;
          // save the favorite template in the settings
          this.plugin.settings.favoriteTemplate = option.fileName;
          this.plugin.saveSettings();
          // refresh the settings tab
          this.display();
        })
    );
  }

  private async downloadAsset(option: Option, path: string): Promise<void> {
    console.log(`Downloading asset from: ${option.downloadUrl}`);
    await downloadFile(this.app, option.downloadUrl, path);
    this.display();
  }

  private async deleteAsset(option: Option): Promise<void> {
    const templatePath =
      this.plugin.manifest.dir + TEMPLATE_DIR + option.fileName;

    try {
      await this.app.vault.adapter.remove(templatePath);
      console.log(`Deleted asset: ${option.name}`);
      this.display();
    } catch (err) {
      console.error(`Error deleting asset ${option.name}:`, err);
    }
  }
}

export { NotePDFSettingsTab, DEFAULT_SETTINGS, PluginSettings };
