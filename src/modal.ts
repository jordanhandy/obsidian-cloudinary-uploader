import { App, Modal,Setting } from "obsidian";

export class WarningModal extends Modal {
    result: string;
    onSubmit: (result: string) => void;
  constructor(app: App, onSubmit: (result:string)=> void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    let { contentEl } = this;
    contentEl.createEl("h1", { text: "Warning" });
    let textFragment = document.createDocumentFragment();
    textFragment.append("This is a potentially dangerous action."+
    "  It is HIGHLY recommended that you backup this note elsewhere before performing this operation."+
    " The media files in this note will attempt to be uploaded to Cloudinary");
    contentEl.createEl("p", { text: textFragment });
    contentEl.createEl("h1", { text: "Other Information" });
    textFragment = document.createDocumentFragment();
    textFragment.append("The success of this action largely depends on the following:");
    textFragment = document.createDocumentFragment();
    textFragment.append('Your Cloudinary account subscription plan -- different plans have different upload limits');
    textFragment.append('The content you upload -- Certain files (example, .exe, .ps1) are not allowed to be uploaded to Cloudinary.  If these are in your vault, the upload of these specific files will fail');
    contentEl.createEl("li", { text: textFragment });

    new Setting(contentEl)
    .addButton((btn) =>
    btn.setButtonText("Continue action")
    .setCta()
    .onClick(()=>{
        this.close();
        this.result = 'true';
        this.onSubmit(this.result)
    }))
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}