# Obsidian Handwritten Notes Plugin

Designed to incorporate stylus notes seamlessly into your workflow. This plugin allows you to store and edit handwritten notes files in your vault.
In the future it will allow you to embed drawings in your documents, and create links to and from other documents or drawings within your notes.

Unlike the [Excalidraw plugin](https://github.com/zsviczian/obsidian-excalidraw-plugin/) for Obsidian, this plugin allows to write notes using a stylus, as it unlike the latter, **the performace of the app doesnt degrade for long notes**.
The plugins backbone are **PDF files**, which are used to store the notes. This allows for a very fast and responsive experience, and allows for easy sharing of notes with other people and makes it more future proof, as PDF is a very well established format.


## Demo

This is a demo of the plugin, showing how to create a new note, and how to annotate an existing note. It is a bit outdated, but the basic functionality is still the same.

[![Watch a demo of the plugin](https://img.youtube.com/vi/dkdKeCJzVQA/default.jpg)](https://youtu.be/dkdKeCJzVQA)

## Features

The plugin is still in early development, but the following features are already implemented:

- [x] Create new notes from different paper templates
- [x] Annotations on existing notes

In addition, as you have the following features available in Obsidian, you can use them with your handwritten notes:

- [x] Embed notes in other md notes
- [x] Reference handwritten notes from other md notes

## Planned Features

The following features are planned for the future:

- [ ] Link md notes to handwritten notes

## Known Issues

- I am having some issues with **Obsidian Sync**, templates might not be synced correctly, but the notes themselves should be fine.
  In case the templates are not synced correctly, you can mannually copy the templates from the plugin folder to your vault on your mobile device.

## Install

Manually Installing the Plugin

- Head over to releases and download a release (latest is recommended) or the pre-release for upcoming features.

- Navigate to your plugin folder in your prefered vault: VaultFolder/.obsidian/plugins/
- Create a new folder called obsidian-handwritten-notes
- Copy and paste over main.js, styles.css, manifest.json into the newly created /obsidian-handwritten-notes.
- Make sure you enable the plugin by going into Settings > Community plugins > Installed plugins > toggle 'Handwritten Notes'.

- Make sure you have a compatible [External Editor](#external-editors) installed (see below).

## External Editors

The plugin is designed to work with external editors, which are used to edit the PDF files. This is done for two reasons:
- Native Performance: The performance of the plugin is much better when using an external editor, as it can use a native PDF editor.
- Flexibility: You can use any PDF editor you want, as long as it supports **opening files from the source in mobile**.

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


## How to compile the plugin

First, install the dependencies with

```bash
npm i
```

Then, you can compile the plugin with:

```bash
npm run build
```

This will create a `main.js` file in the project root. That is the entry point of your plugin.
