import {
  TFile,
  App,
  normalizePath,
  Notice,
  Plugin,
  requestUrl,
  ButtonComponent,
} from "obsidian";
import { DEFAULT_TEMPLATE_DIR } from "./constants";
import NotePDF from "src/main";

/**
 * Loads the PDF template from the specified path.
 *
 * @param {App} app - The obsidian app instance.
 * @param {string} path - The template file to be loaded.
 * @return {Promise<any>} The loaded template in binary format.
 */
export async function loadPdfTemplate(app: App, path: string): Promise<any> {
  return app.vault.adapter.readBinary(normalizePath(path));
}

/**
 * Creates a binary file in the specified path.
 *
 * @param {App} app - The obsidian app instance.
 * @param {any} template - The template to be written to the file.
 * @param {string} path - The path where the file will be created.
 * @throws Will throw an error if the file already exists or on creation failure.
 */
export async function createBinaryFile(
  app: App,
  template: any,
  path: string
): Promise<void> {
  try {
    await app.vault.createBinary(path, template);
  } catch (e) {
    new Notice(
      e.message.includes("already exists")
        ? "File already exists!"
        : "Error creating file! Note: " + e.message
    );
    console.log(e);
  }
}

/**
 * Opens a file in the obsidian app.
 *
 * @param {App} app - The obsidian app instance.
 * @param {string} path - The path of the file to be opened.
 */
export async function openCreatedFile(app: App, path: string): Promise<void> {
  const leaf = app.workspace.getLeaf(false);
  const file = app.vault.getAbstractFileByPath(path);

  if (file instanceof TFile) {
    await leaf.openFile(file);
  }
}

/**
 * Appends an 'Annotate' button to the specified toolbar.
 *
 * @param {HTMLElement} toolbar - The toolbar where the button will be appended.
 * @param {App} app - The obsidian app instance.
 * @param {() => Promise<void>} onClick - The async function to be executed when the button is clicked.
 */
export function appendAnnotateButton(
  toolbar: HTMLElement,
  onClick: () => Promise<void>
): void {
  // Check if the button already exists before appending
  let matchingChild = toolbar.querySelector(".pdf-annotate-button");
  if (matchingChild) return;

  // Check if the button already exists before appending
  const button = new ButtonComponent(toolbar).setIcon("pen-tool");
  // give it a unique id so we can find it later

  button.setTooltip("Annotate");
  // button.buttonEl.classList.add("pdf-annotate-button");
  button.setClass("pdf-annotate-button");
  button.setClass("clickable-icon");

  // Handle the async onClick function
  button.onClick(async () => {
    try {
      await onClick();
    } catch (error) {
      console.error("Error handling async onClick:", error);
    }
  });
}

/**
 * Initializes the templates folder if it doesn't exist.
 *
 * @param {Plugin} plugin - The obsidian plugin instance.
 * @throws Will throw an error if there's an issue in creating the folder.
 */
export async function initTemplatesFolder(plugin: Plugin): Promise<void> {
  // @ts-ignore
  const templatesFolder = await getTemplatesFolder(plugin);

  try {
    await plugin.app.vault.createFolder(templatesFolder);
  } catch (e) {
    // Ignore error if folder already exists
  }

  const defaultTemplatePath = normalizePath(templatesFolder + "/blank.pdf");
  if (await fileExists(plugin.app, defaultTemplatePath)) return;
  // Download default template if it doesn't exist
  const TEMPLATE_URL = "https://mag.wcoomd.org/uploads/2018/05/blank.pdf";
  await downloadFile(plugin.app, TEMPLATE_URL, defaultTemplatePath);
  // console.log("Downloaded template to " + defaultTemplatePath);
}

/**
 * Downloads a file from a URL and saves it to the specified path.
 *
 * @param {App} app - The obsidian app instance.
 * @param {string} url - The URL of the file to be downloaded.
 * @param {string} path - The path where the file will be saved.
 * @throws Will throw an error if there's an issue in fetching the file.
 */
export async function downloadFile(
  app: App,
  url: string,
  path: string
): Promise<void> {
  try {
    const response = await requestUrl({
      url: url,
      method: "GET",
      contentType: "arraybuffer",
    });

    const body = await response.arrayBuffer;
    await app.vault.createBinary(path, body);
  } catch (err) {
    console.error(err);
    new Notice("Error fetching file!");
  }
}

/** Checks if a file exists in the vault.
 * @param {App} app - The obsidian app instance.
 * @param {string} path - The path of the file to be checked.
 * @return {boolean} True if the file exists, false otherwise.
 *
 * @throws It will throw an error if the file exists
 * @brief Use vault.adapter.exists to determine if the file exists. This works for all files, whether in or out of the vault.
 */
export async function fileExists(app: App, path: string): Promise<boolean> {
  console.log("Checking if file exists: " + path);
  try {
    const exists = await app.vault.adapter.exists(path);
    console.log("File exists: " + exists);
    return exists;
  } catch (err) {
    console.error("Error checking file existance");
    return false;
  }
}

/** Gets the path of the template folder based on the current settings.
 * @param plugin The obsidian plugin instance.
 * @return {string} The path of the template folder.
 * @brief If the templates are stored in the custom folder, return the custom folder path. Otherwise, return the default folder path.
 */

export async function getTemplatesFolder(plugin: NotePDF): Promise<string> {
  const settings = plugin.settings;
  return settings.templatesAtCustom
    ? normalizePath(settings.templatesPath)
    : normalizePath(plugin.manifest.dir + DEFAULT_TEMPLATE_DIR);
}
