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

	onChooseSuggestion(item: TFolder, evt: MouseEvent | KeyboardEvent) {
		this.onSubmit(item);
		this.close();
	}
}

export class ChooseDestinationSearch extends AbstractInputSuggest<TFolder> {
	constructor(
		private inputEl: HTMLInputElement,
		app: App,
		private onSubmit: (value: TFolder) => void,
	) {
		super(app, inputEl);
	}

	renderSuggestion(value: TFolder, el: HTMLElement) {
		el.setText(value.path);
	}

	protected getSuggestions(query: string): TFolder[] {
		return (
			this.app.vault
				//@ts-ignore
				.getAllFolders()
				.filter((folder: TFolder) => {
					return folder.path.toLowerCase().contains(query.toLowerCase());
				})
		);
	}
	selectSuggestion(value: TFolder, _evt: MouseEvent | KeyboardEvent): void {
		this.inputEl.value = value.path;
		this.onSubmit(value);
		this.inputEl.focus();
		this.inputEl.trigger("input");
		this.close();
	}
}
