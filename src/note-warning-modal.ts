import { App, Modal,Setting } from "obsidian";

export class NoteWarningModal extends Modal {
    result: string;
    type: string;
    onSubmit: (result: string) => void;
  constructor(app: App, type:string,onSubmit: (result:string)=> void) {
    super(app);
    this.onSubmit = onSubmit;
    this.type = type;
  }

  onOpen() {
    let { contentEl } = this;
    if(this.type == 'note'){
      contentEl.createEl("h1", { text: "Note Media Upload - Warning" });
    }else{
      contentEl.createEl("h1", { text: "Mass Asset Backup - Warning" });
    }
    let textFragment = document.createDocumentFragment();
    textFragment.append("This is a potentially dangerous action."+
    "  It is HIGHLY recommended that you backup this note elsewhere before performing this operation."+
    " The media files in this note will attempt to be uploaded to Cloudinary");
    contentEl.createEl("p", { text: textFragment });
    contentEl.createEl("h1", { text: "Other Information" });
    textFragment = document.createDocumentFragment();
    textFragment.append("As a precaution, your local files in your vault will NOT be deleted, and will still remain in your vault "+
    " if you need to reference them.  The success of this action largely depends on the following:");
    contentEl.createEl("p", { text: textFragment });
    textFragment = document.createDocumentFragment();
    textFragment.append('Your Cloudinary account subscription plan -- different plans have different upload limits');
    contentEl.createEl("li", { text: textFragment });
    textFragment = document.createDocumentFragment();
    textFragment.append('The content you upload -- Certain files (example, .exe, .ps1) are not allowed to be uploaded to Cloudinary.  If these are in your vault, the upload of these specific files will fail');
    contentEl.createEl("li", { text: textFragment });
    if(this.type == 'note'){
      textFragment.append('Should this process fail, or timeout, you can attempt to run the same command again as assets already uploaded to Cloudinary should not be reuploaded because of how the file search is completed for initial upload.')
    }else{
      textFragment.append('Should this process fail, trying again will start fresh from the beginning.  This is because there is currently no flag to denote if an upload has been completed from a previous attempt.'
      +  '  Additionally, depending on your Cloudinary settings (within the upload preset in the Cloudinary account, pre-existing files may be overwritten OR duplicated depending on these settings.');
    }
    contentEl.createEl("p",{ text : textFragment });

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