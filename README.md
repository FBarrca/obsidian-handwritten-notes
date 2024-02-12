# Obsidian Handwritten Notes Plugin

Designed to seamlessly incorporate stylus notes into your workflow, this plugin allows you to store and edit handwritten notes files right in your vault. Future implementations will enable embedding drawings in documents and creating interlinks between documents or drawings.

> 🔗 Unlike the [Excalidraw plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin/) for Obsidian, this plugin allows to write notes using a stylus, as the performace of the doesnt degrade for **long notes**.

> The plugins backbone are **PDF files**, which are used to store the notes. This allows for a very fast and responsive experience, and allows for easy sharing of notes with other people and makes it more future proof, as PDF is a very well established format.

> [!NOTE]
> Please, if you own an iOS, macOS or Linux device, open an issue sharing your experience by opening an issue. I want to highlight the best editors for those platform in the README, but I don't own said devices.

## 🎥 Demo

This is a demo of the plugin, showing how to create a new note, and how to annotate an existing note. It is a bit outdated, but the basic functionality is still the same.

[![Watch a demo of the plugin](https://img.youtube.com/vi/dkdKeCJzVQA/default.jpg)](https://youtu.be/dkdKeCJzVQA)

## 🚀 Features

The plugin is still in early development, but the following features are already implemented:

- [x] Create new notes from different paper templates
- [x] Annotations on existing notes

In addition, as you have the following features available in Obsidian, you can use them with your handwritten notes:

- [x] Embed notes in other md notes
- [x] Reference handwritten notes from other md notes


## 📅 Planned Features

The following features are planned for the future:

- [ ] Link md notes to handwritten notes

## ⚠️ Known Issues

- I am having some issues with **Obsidian Sync**, templates might not be synced correctly, but the notes themselves should be fine.
  In case the templates are not synced correctly, you can mannually copy the templates from the plugin folder to your vault on your mobile device.

## 🔧 Install

**Manual Installation Steps**:

1. Visit releases to procure the latest release or preview upcoming features.
2. Direct to your desired vault's plugin directory: `VaultFolder/.obsidian/plugins/`
3. Forge a fresh folder named `obsidian-handwritten-notes`
4. Transfer `main.js`, `styles.css`, and `manifest.json` to the freshly-minted `/obsidian-handwritten-notes`.
5. Activate the plugin: Settings > Community plugins > Installed plugins > Toggle 'Handwritten Notes'.
6. Ensure a congruent [External Editor](#external-editors) is on standby (details below).

## 📑 External Editors

For the plugin to function, an external editor is required.
Employment of external editors for PDF file modifications enhances:

- **Native Performance**: Leveraging a native PDF editor enriches plugin performance.
- **Flexibility**: Enjoy the freedom of choosing any PDF editor, provided it supports **mobile file source opening**.

Here are some recommendations:

### Windows

You can use **any editor** you like that has support for annotating PDF files.
Here are some examples:

- [Xodo](https://www.xodo.com/app/)
- [PDFannotator](https://www.pdfannotator.com/en/)
- [Adobe Acrobat Reader](https://acrobat.adobe.com/us/en/acrobat/pdf-reader.html)

### Android

Here, the options are a bit more limited, as the editor needs to support opening files from the source in mobile.
These are the editors I have tested: (If you have tested other editors, please PR this list)

- Xodo (my favourite), which is currently freemium, but one can use an outdated version that has no locked features
- Adobe Acrobat
- Samsung's Write on PDF
- Microsoft's PDF editor
- PenandPdf (open-source, though abandoned)

### iOS

- Native Markup - This is one I use, it's pretty basic but all I need without bells & whistles
   - ⚠️ To save the file, you need to tap Done > Delete PDF. It doesn't delete the original PDF and instead saves the drawings into the original PDF. I have no idea why Apple designed it like this. Perhaps it may be an unexpected usage for them.
- PDF Editor - Also great, but again, subscription is needed although for different options that PDF Expert. (So you can use both of them, for achieving best results, but friction of using 3 apps is annoying).
- Notes Writer - Overall probably the best of those three, free (you can purchase Pro version super cheap). Only thing it's lacking and it was deal breaker for me is auto shapes (triangles, circles etc.).

## 🛠️ How to compile the plugin

Kickstart with dependencies:

```bash
npm i
```

Then, you can compile the plugin with:

```bash
npm run build
```

This will create a `main.js` file in the project root. That is the entry point of your plugin.

## 🙏 Credits

Thanks to [Obsidian copy url in preview](https://github.com/NomarCub/obsidian-copy-url-in-preview) for the type extensions used to interface with PDFs.
Thanks to [DataLoom](https://github.com/trey-wallis/obsidian-dataloom) for the onboarding screen.
