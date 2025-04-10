import { type App, SuggestModal, type TFolder } from "obsidian";

export class ChooseDestModals extends SuggestModal<TFolder> {
	constructor(
		app: App,
		private onSubmit: (result: TFolder) => void,
	) {
		super(app);
	}

	getSuggestions(query: string) {
		return this.app.vault
			.getAllFolders()
			.filter((folder) => folder.path.toLowerCase().includes(query));
	}

	renderSuggestion(value: TFolder, el: HTMLElement) {
		el.createEl("div", { text: value.name });
		el.createEl("small", { text: value.path });
	}

	onChooseSuggestion(item: TFolder, evt: MouseEvent | KeyboardEvent) {
		this.onSubmit(item);
		this.close();
	}
}
