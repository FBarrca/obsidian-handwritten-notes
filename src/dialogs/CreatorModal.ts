import { App, Modal, Setting, normalizePath } from "obsidian";

export class PDFCreatorModal extends Modal {
  result: { name: string; template: string } = {
    name: "New note",
    template: "blank.pdf",
  };
  manifest: any;
  onSubmit: (result: { name: string; template: string }) => void;
 

  constructor(
      app: App,
      manifest: any,
      onSubmit: (result: { name: string; template: string }) => void,
 
  ) {
      super(app);
      this.onSubmit = onSubmit;
      this.manifest = manifest;
  }
  async onOpen() {
    let { contentEl } = this;

    contentEl.createEl("h1", { text: "Create New note" });
    new Setting(contentEl).setName("Name").addText((text) => {
      text.setValue(this.result["name"]);
      text.onChange((value) => {
        this.result["name"] = value;
      });
    });
    new Setting(contentEl).setName("Template").addDropdown(async (dropDown) => {
      // read all files in the template folder
      // add them to the dropdown menu
      const templateFolder = normalizePath(
        this.manifest.dir + "/templates" 
      );

      const files = (await this.app.vault.adapter.list(templateFolder)).files;
      for (let i = 0; i < files.length; i++) {
        // get the file name, it is the last part of the path
        const file = files[i].split("/").pop();
        if (!file) continue; // skip if the file is null
        // check if the file is a pdf
        if (file.split(".")[1] !== "pdf") continue;
        // name should be the filename without the extension and capitalized
        const fileName =
          file?.split(".")[0]?.charAt(0).toUpperCase() +
          file?.split(".")[0]?.slice(1);
        dropDown.addOption(file, fileName);
      }
      dropDown.onChange((value) => {
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
