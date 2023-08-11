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

interface Option {
  name: string;
  desc: string;
  fileName: string;
  downloadUrl: string;
  isDefault: boolean;
}

interface PluginSettings {
  templatePath: string;
  assetUrl: string;
  useRelativePaths: boolean;
  openNewNote: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
  templatePath: "/pdf-templates/",
  assetUrl: "",
  useRelativePaths: false,
  openNewNote: true,
};

const TEMPLATE_DIR = "/templates/";

const SETTINGS_OPTIONS: Option[] = [
  {
    name: "Blank",
    fileName: "blank.pdf",
    desc: "A blank template. (Default)",
    downloadUrl: "",
    isDefault: true,
  },
  {
    name: "Lined",
    fileName: "lined.pdf",
    desc: "A 5mm lined A4",
    downloadUrl:
      "https://www.inksandpens.com/content/files/paper-templates/A4%20Lined%205mm.pdf",
    isDefault: false,
  },
  {
    name: "Canvas",
    fileName: "canvas.pdf",
    desc: "A blank A0 for virtual whiteboard use",
    downloadUrl: "https://www.a0-size.com/download/118/?tmstv=1691357093",
    isDefault: false,
  },
];

class MyPluginSettingTab extends PluginSettingTab {
  private readonly plugin: any;

  constructor(app: App, plugin: any) {
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
      text: "New Note Settings",
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
    folderButton.buttonEl.style.boxShadow = "none";
    folderButton.buttonEl.style.cssFloat = "right";

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

      if (option.isDefault) continue;

      const templatePath =
        this.plugin.manifest.dir + TEMPLATE_DIR + option.fileName;

      if (await fileExists(this.app, templatePath)) {
        setting.addButton((button) =>
          button
            .setIcon("trash")
            .onClick(async () => await this.deleteAsset(option))
        );
      } else {
        setting.addButton((button) =>
          button
            .setIcon("install")
            .onClick(async () => await this.downloadAsset(option, templatePath))
        );
      }
    }
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

export { MyPluginSettingTab, DEFAULT_SETTINGS, PluginSettings };
