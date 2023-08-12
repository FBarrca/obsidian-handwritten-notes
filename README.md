# Obsidian Handwritten Notes Plugin

Designed to seamlessly incorporate stylus notes into your workflow, this plugin allows you to store and edit handwritten notes files right in your vault. Future implementations will enable embedding drawings in documents and creating interlinks between documents or drawings.

> 🔗 Unlike the [Excalidraw plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin/) for Obsidian, this plugin allows to write notes using a stylus, as the performace of the doesnt degrade for **long notes**.

> The plugins backbone are **PDF files**, which are used to store the notes. This allows for a very fast and responsive experience, and allows for easy sharing of notes with other people and makes it more future proof, as PDF is a very well established format.

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
- [Drawboard PDF](https://www.drawboard.com/pdf/)
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

I have not tested any editors on iOS, but I assume that the same editors as on Android will work. Please add to this list if you have tested any editors.

Update: It works great with the iPadOS 17 markup tool.

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
