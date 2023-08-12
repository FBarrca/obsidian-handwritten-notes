import {
  App,
  DropdownComponent,
  Modal,
  Notice,
  Platform,
  MarkdownRenderer,
} from "obsidian";
import NotePDF from "src/main";
//@ts-ignore
import AndroidShareImage from "./ShareMenuAndroid.png";

export default class WelcomeModal extends Modal {
  private instructionsContainer: HTMLElement;
  private plugin: NotePDF;

  constructor(app: App, plugin: NotePDF) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    this.initializeHeader();
    this.createPlatformSelector();
    this.firstStep();

    this.instructionsContainer = this.contentEl.createEl("div");
    this.renderPlatformSpecificInstructions();
  }

  private initializeHeader() {
    this.contentEl.createEl("h2", { text: "Welcome to Handwritten Notes" });
    this.contentEl.createDiv({
      text: "Create and edit handwritten notes inside your Obsidian vault.",
    });
    const divider = this.contentEl.createEl("hr");
    divider.style.margin = "10px 0px";
  }

  private createPlatformSelector() {
    // Create a flex container
    const learnAndPlatformContainer = this.contentEl.createEl("div");
    // add styling

    learnAndPlatformContainer.style.display = "flex";
    learnAndPlatformContainer.style.justifyContent = "space-between";

    learnAndPlatformContainer.createEl("h5", {
      text: "Learn how to use",
    });

    const platformContainer = learnAndPlatformContainer.createEl("div");
    // center vertically its children
    platformContainer.style.display = "flex";
    platformContainer.style.alignItems = "center";

    const platformText = platformContainer.createEl("h6", {
      text: "Platform:",
    });
    platformText.style.marginRight = "10px";

    const platformSelector = this.initializePlatformOptions(platformContainer);
  }

  private initializePlatformOptions(parentEl: HTMLElement): DropdownComponent {
    const platformSelector = new DropdownComponent(parentEl);
    platformSelector.selectEl.addClass("mod-primary");
    platformSelector.addOptions({
      windows: "Windows",
      mac: "Mac",
      linux: "Linux",
      android: "Android",
      ios: "iOS",
    });
    platformSelector.onChange((selectedPlatform) =>
      this.renderInstructions(selectedPlatform)
    );

    return platformSelector;
  }

  private detectCurrentPlatform(): string | null {
    if (Platform.isWin) return "windows";
    if (Platform.isMacOS) return "mac";
    if (Platform.isLinux) return "linux";
    if (Platform.isAndroidApp) return "android";
    if (Platform.isIosApp) return "ios";
    return null;
  }

  onClose() {
    this.contentEl.empty();
  }

  private renderPlatformSpecificInstructions() {
    const currentPlatform = this.detectCurrentPlatform();

    if (currentPlatform) {
      this.renderInstructions(currentPlatform);
    } else {
      new Notice("Unknown platform");
    }
  }

  private renderInstructions(platform: string) {
    this.instructionsContainer.empty();

    if (platform === "android") this.renderAndroidInstructions();
    else if (platform === "windows") this.renderWindowsInstructions();
    else if (platform === "mac") this.renderMacInstructions();
    else if (platform === "linux") this.renderLinuxInstructions();
    else if (platform === "ios") this.renderIOSInstructions();
  }

  private firstStep() {
    MarkdownRenderer.render(
      this.app,
      `1. Click on the <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-pen-tool"><path d="m12 19 7-7 3 3-7 7-3-3z"></path><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="m2 2 7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg> icon on the PDF toolbar
	  `,
      this.contentEl,
      "",
      this.plugin
    );

    const toolbarHtml = `<div class="pdf-toolbar"><div class="pdf-toolbar-left"><div class="clickable-icon" aria-label="Toggle sidebar"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-layout-list"><rect x="3" y="14" width="7" height="7"></rect><rect x="3" y="3" width="7" height="7"></rect><line x1="14" y1="4" x2="21" y2="4"></line><line x1="14" y1="9" x2="21" y2="9"></line><line x1="14" y1="15" x2="21" y2="15"></line><line x1="14" y1="20" x2="21" y2="20"></line></svg></div><div class="clickable-icon" aria-label="Sidebar options"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg></div><div class="pdf-toolbar-spacer"></div><div class="clickable-icon" aria-label="Zoom out"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-zoom-out"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg></div><div class="pdf-toolbar-divider"></div><div class="clickable-icon" aria-label="Zoom in"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-zoom-in"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg></div><div class="clickable-icon" aria-label="Display options"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg></div><div class="pdf-toolbar-spacer"></div><input class="pdf-page-input" type="number" max="1"><span class="pdf-page-numbers">of 1</span></div><div class="pdf-toolbar-right"><div class="pdf-toolbar-spacer"></div><div class="clickable-icon" aria-label="Open"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-more-vertical"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div></div><button id="annotate1" aria-label="Annotate" style="padding: 4px 6px; box-shadow: none; float: right;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-pen-tool"><path d="m12 19 7-7 3 3-7 7-3-3z"></path><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="m2 2 7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg></button></div>`; // Truncated the given string for brevity.
    this.contentEl.insertAdjacentHTML("beforeend", toolbarHtml);
  }

  private renderAndroidInstructions() {
    MarkdownRenderer.render(
      this.app,
      `2. Now select the editor to use.
		 ** I strongly suggest you use [Xodo PDF Editor](https://play.google.com/store/apps/details?id=com.xodo.pdf.reader&hl=en&gl=US)**, but any of these should work`,
      this.instructionsContainer,
      "",
      this.plugin
    );

    const shareimg = this.instructionsContainer.createEl("img", {
      attr: { src: AndroidShareImage, alt: "Android Share Menu" },
    });
    shareimg.style.width = "100%";
    shareimg.style.maxWidth = "300px";
    // center horizontally
    shareimg.style.margin = "0 auto";
    shareimg.style.display = "block";
    shareimg.style.marginLeft = "auto";
    shareimg.style.marginRight = "auto";
    MarkdownRenderer.render(
      this.app,
      `3. Edit the PDF in your editor of choice.
		4. When you are finished, go back to return to Obsidian, **all your changes should be reflected there**. 
		That's it, enjoy using the plugin! 🎉`,
      this.instructionsContainer,
      "",
      this.plugin
    );
  }
  private renderWindowsInstructions() {
    MarkdownRenderer.render(
      this.app,
      `2. Switch to the newly created application.
3. Edit the PDF in your editor of choice.
> [!INFO] The app uses your default pdf viewer

4. When you are finished, go save and close the app to return to Obsidian, **all your changes should be reflected there**. 
	That's it, enjoy using the plugin! 🎉
		`,

      this.instructionsContainer,
      "",
      this.plugin
    );
  }
  private renderMacInstructions() {
	MarkdownRenderer.render(
		this.app,
		`Instructions not yet finished for your platform, please PR if you own the device`,
  
		this.instructionsContainer,
		"",
		this.plugin
	  );
  }
  private renderLinuxInstructions() {
	MarkdownRenderer.render(
		this.app,
		`Instructions not yet finished for your platform, please PR if you own the device`,
  
		this.instructionsContainer,
		"",
		this.plugin
	  );
  }
  private renderIOSInstructions() {
	MarkdownRenderer.render(
		this.app,
		`Instructions not yet finished for your platform, please PR if you own the device`,
  
		this.instructionsContainer,
		"",
		this.plugin
	  );
  }
}
