# Obsidian Handwritten Notes Plugin

A plugin to seamlessly integrate stylus-based handwritten notes directly into your Obsidian vault. Designed for efficient note-taking with long-term compatibility through PDF-based storage. [File Over App](https://github.com/FBarrca/obsidian-handwritten-notes/blob/master/README.md#-manifesto-file-over-app)

> 💡 Unlike the [Excalidraw plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin), this plugin supports **long stylus-based notes** without performance issues.

> [!WARNING] **Mobile Support Is Limited**  
> Not all mobile apps support direct **editing** of files. Before reporting an issue, ensure your editor supports direct file editing (not just importing).  
> Refer to the [**External Editors Section**](https://github.com/FBarrca/obsidian-handwritten-notes/blob/master/README.md#-external-editors) for a list of recommended apps for different platforms.

> [!DANGER] **Unsupported Editors Warning**  
> 🚨 Many issues arise from unsupported editors. Please check the [**External Editors Section**](https://github.com/FBarrca/obsidian-handwritten-notes/blob/master/README.md#-external-editors) before proceeding!

---

## 🌟 Key Features

- **Easy Note Creation**: Use various paper templates.
- **Simple Annotation**: Edit and annotate handwritten PDFs from within your vault.
- **Obsidian Integration**: Embed and reference notes in Markdown files.

---

## 🎥 Demo

Watch this quick demo showcasing note creation and annotation:  
[![Plugin Demo](https://img.youtube.com/vi/dkdKeCJzVQA/default.jpg)](https://youtu.be/dkdKeCJzVQA)

---

## 📂 External Editors

To work with handwritten notes, a compatible external PDF editor is **mandatory**. Unsupported editors are the primary cause of issues. Refer to the recommended apps for your platform below:

### **Windows**

|App Name|Description|
|---|---|
|[Xodo](https://www.xodo.com/app/)|Preferred|
|[PDFannotator](https://www.pdfannotator.com/en/)||
|[Adobe Acrobat Reader](https://acrobat.adobe.com/us/en/acrobat/pdf-reader.html)||

### **Android**

|App Name|Description|
|---|---|
|[Xodo](https://www.xodo.com/app/)|**Preferred**; older APKs before Xodo 5.0.22 are 100% free|
|Adobe Acrobat||
|Samsung's Write on PDF|Built-in PDF editor for Samsung devices|
|Microsoft's PDF Editor|PDF editor by Microsoft|
|PenandPdf|Open-source, though abandoned|

### **iOS (Community Curated)**

|App Name|Description|Instructions|
|---|---|---|
|**Native Markup**|Basic but functional without extra features.|⚠️ To save the file, tap **Done > Delete PDF**. This action saves the drawings into the original PDF without deleting it.|
|**PDF Editor**|Effective but requires a subscription.|Not specified.|
|**Notes Writer**|Feature-rich and affordable, but lacks auto shapes for diagrams.|To modify the original document, tap the **Notes Writer Pro** icon at the top of the **Share** menu.|

### **Linux (Community Curated)**

|App Name|Description|
|---|---|
|**Xournal++**|Fast and responsive, though struggles with large files containing images.|
|**Saber**|Promising UI with cloud storage; limited file import support.|
|**Scrivano**|Excellent potential but lacks a file tree view and session memory.|

---

## ⚠️ Known Issues

- **Obsidian Sync**: Templates may not sync correctly. If this occurs, manually copy the templates from the plugin folder to your mobile device's vault.

---

## 🔧 Installation Guide

### **Manual Installation**

1. Download the latest release from the repository.
2. Go to your Obsidian vault's plugin directory: `VaultFolder/.obsidian/plugins/`.
3. Create a folder named `obsidian-handwritten-notes`.
4. Move the files `main.js`, `styles.css`, and `manifest.json` into this folder.
5. Enable the plugin:
    - Navigate to `Settings > Community Plugins > Installed Plugins` and toggle **Handwritten Notes**.
6. Ensure you have a compatible external PDF editor set up (see recommendations in the [**External Editors Section**](https://github.com/FBarrca/obsidian-handwritten-notes/blob/master/README.md#-external-editors)).

---

## 🛠️ Building the Plugin

To compile the plugin locally:

1. Install dependencies:
    
    ```bash
    npm i
    ```
    
2. Build the plugin:
    
    ```bash
    npm run build
    ```
    
    The compiled `main.js` file will appear in the project root.
    

---

## 🙏 Credits

- [Obsidian Copy URL in Preview](https://github.com/NomarCub/obsidian-copy-url-in-preview) for PDF type extensions.
- [DataLoom](https://github.com/trey-wallis/obsidian-dataloom) for onboarding screen inspiration.

---

## 📜 Manifesto: File Over App

This plugin aligns with the [**File Over App**](https://stephango.com/file-over-app) philosophy:

> If you want to create digital artifacts that last, they must be files you can control, in formats that are easy to retrieve and read. Use tools that give you this freedom.

Apps are ephemeral, but the files you create can last. In the fullness of time, the files—more than the tools—will be what matters. This is why **Obsidian Handwritten Notes Plugin** prioritizes PDF-based handwritten notes: a durable, widely supported format that stands a better chance of being readable decades from now.

By embracing this philosophy, this plugin ensures that your notes are:

- Portable and independent of the tools used to create them.
- Compatible across a wide range of devices and operating systems.
- Future-proof for retrieval and annotation by your future self.

The ideas you record today deserve to outlive the tools you use to record them. Prioritize formats that will endure.
