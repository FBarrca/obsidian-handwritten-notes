import { App, Modal, setIcon } from "obsidian";


export default class WelcomeModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Welcome to Handwritten Notes" });

	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}