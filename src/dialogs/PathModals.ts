import {
	AbstractInputSuggest,
	type App,
	SuggestModal,
	type TFolder,
} from "obsidian";

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

	onChooseSuggestion(item: TFolder, _evt: MouseEvent | KeyboardEvent) {
		this.onSubmit(item);
		this.close();
	}
}

export class ChooseDestinationSearch extends AbstractInputSuggest<string> {
	constructor(
		private inputEl: HTMLInputElement,
		app: App,
		private onSubmit: (value: string) => void,
	) {
		super(app, inputEl);
	}

	renderSuggestion(value: string, el: HTMLElement) {
		el.setText(value);
	}

	protected getSuggestions(query: string): string[] {
		const sugg = this.app.vault
			.getAllFolders()
			.filter((folder: TFolder) => {
				return folder.path.toLowerCase().contains(query.toLowerCase());
			})
			.map((folder: TFolder) => folder.path);
		if (sugg.length === 0) return [query];
		return sugg;
	}
	selectSuggestion(value: string, _evt: MouseEvent | KeyboardEvent): void {
		this.inputEl.value = value;
		this.onSubmit(value);
		this.inputEl.focus();
		this.inputEl.trigger("input");
		this.close();
	}
}
