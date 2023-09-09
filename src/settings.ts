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

  isDefault: boolean;
}

interface PaperOptions

interface PluginSettings {
  templatePath: string;
  assetUrl: string;
  useRelativePaths: boolean;
  openNewNote: boolean;
  showWelcomeModal: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
  templatePath: "/handwritten-notes/",
  assetUrl: "",
  useRelativePaths: false,
  openNewNote: true,
  showWelcomeModal: true,
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

class NotePDFSettingsTab extends PluginSettingTab {
  private readonly plugin: NotePDF;

  constructor(app: App, plugin: NotePDF) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    this.containerEl.createEl("h1", {
      text: "New note settings",
    });
    this.containerEl.createEl("h2", {
      text: "Folder location",
    });
    this.RelativePathToggle();
    this.defaultPathInput();
    this.OpenNewNoteToggle();
    this.containerEl.createEl("h2", {
      text: "Templates",
    });
    this.createTemplatesSection();
    this.createSettingWithOptions();
    this.containerEl.createEl("h2", {
      text: "Templates",
    });
    this.createTemplatesSection();
    this.createSettingWithOptions();
  }

  private OpenNewNoteToggle(): void {
    new Setting(this.containerEl)
      .setName("Open new note")
      .setDesc("Open new note in active window after creating it.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.openNewNote)
          .onChange((value) => (this.plugin.settings.openNewNote = value))
      );
  }

  private RelativePathToggle(): void {
    new Setting(this.containerEl)
      .setName("Use relative path")
      .setDesc("Use relative path for the template path.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useRelativePaths)
          .onChange((value) => (this.plugin.settings.useRelativePaths = value))
      );
  }

  private defaultPathInput(): void {
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

export { NotePDFSettingsTab, DEFAULT_SETTINGS, PluginSettings };
