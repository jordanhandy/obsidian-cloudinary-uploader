// Imports for plugin
import {
  Notice,
  Plugin,
  Editor,
} from "obsidian";

// For API requests
import axios from "axios"
import objectPath from 'object-path'

// Settings tab import
import CloudinaryUploaderSettingTab from './settings-tab'
import { DEFAULT_SETTINGS, CloudinarySettings } from "./settings-tab";
export default class CloudinaryUploader extends Plugin {
  settings: CloudinarySettings;

  private clearHandlers(){
    this.app.workspace.off('editor-paste',this.pasteHandler);
    this.app.workspace.off('editor-drop',this.dropHandler);
  }

  private setupHandlers(){
    if(this.settings.clipboardUpload){
      this.registerEvent(this.app.workspace.on('editor-paste',this.pasteHandler));
    }else{
      this.app.workspace.off('editor-paste',this.pasteHandler);
    }
    if(this.settings.dropUpload){
      this.registerEvent(this.app.workspace.on('editor-drop',this.dropHandler));
    }else{
      this.app.workspace.off('editor-drop',this.dropHandler);
    }
  }
  private pasteHandler = async(event : ClipboardEvent, editor: Editor)=>{
    const { files } = event.clipboardData;
    await this.uploadFiles(files,event,editor); // to fix
  }
  private dropHandler = async(event: DragEventInit, editor: Editor) =>{ 
    const { files } = event.dataTransfer;
    await this.uploadFiles(files,event,editor); // to fix
  }

  private uploadFiles = async (files: FileList,event,editor) => {

  // On paste event, get "files" from clipbaord or drag data
  // If files contain image, video, or audio move to API call
  // if Files empty or does not contain above, then keep default paste behaviour
      if(files.length > 0){
        if((this.settings.audioUpload && files[0].type.startsWith("audio")) ||
          (this.settings.videoUpload && files[0].type.startsWith('video')) ||
          (this.settings.imageUpload && files[0].type.startsWith('image')) ||

          (this.settings.rawUpload && !files[0].type.startsWith('image')) &&
           !files[0].type.startsWith('audio') && !files[0].type.startsWith('video') ){
            event.preventDefault(); // Prevent default paste behaviour

       if (this.settings.cloudName && this.settings.uploadPreset) {
        for (let file of files) {
          const randomString = (Math.random() * 10086).toString(36).substr(0, 8)
          const pastePlaceText = `![uploading...](${randomString})\n`
          editor.replaceSelection(pastePlaceText) // Generate random string to show on editor screen while API call completes
          // Cloudinary request format
          // Send form data with a file and upload preset
          // Optionally define a folder
          const formData = new FormData();
          formData.append('file',file);
          formData.append('upload_preset',this.settings.uploadPreset);
          formData.append('folder',this.setSubfolder(file));

          // Make API call
          axios({
            url: `https://api.cloudinary.com/v1_1/${this.settings.cloudName}/auto/upload`,
            method: 'POST',
            data: formData
          }).then(res => {
          // Get response public URL of uploaded image
          console.log(res);
            let url = objectPath.get(res.data, 'secure_url')
            let replaceMarkdownText ="";

            // Split URL to allow for appending transformations
            if(this.settings.transformParams){
              const splitURL = url.split("/upload/",2);
              url = splitURL[0]+="/upload/"+this.settings.transformParams+"/"+splitURL[1];
              replaceMarkdownText = `![](${url})`;
            }
            if(this.settings.f_auto){
              const splitURL = url.split("/upload/",2);
              url = splitURL[0]+="/upload/f_auto/"+splitURL[1];
              replaceMarkdownText = `![](${url})`;
            
            // leave standard of no transformations added
            }else{
            replaceMarkdownText = `![](${url})`;
            }
            // Change URL format based on content type
            if(files[0].type.startsWith("audio")){
              replaceMarkdownText = `<audio src="${url}" controls></audio>\n`
            }else if(files[0].type.startsWith("video")){
              replaceMarkdownText = `<video src="${url}" controls></video>\n`
            }
            // Show MD syntax using uploaded image URL, in Obsidian Editor
            this.replaceText(editor, pastePlaceText, replaceMarkdownText)
          }, err => {
          // Fail otherwise
            new Notice("There was something wrong with the upload.  PLease check your cloud name and template name before trying again "+err, 5000)
            console.log(err)
          })
        }
      }
  }
}
}

  // Set subfolder for upload
  private setSubfolder(file : File){
    if(file.type.startsWith("image")){
      return `${this.settings.folder}/${this.settings.imageSubfolder}`;
    }else if(file.type.startsWith("audio")){
      return `${this.settings.folder}/${this.settings.audioSubfolder}`;
    }else if(file.type.startsWith("video")){
      return `${this.settings.folder}/${this.settings.videoSubfolder}`;
    }else{
      return `${this.settings.folder}/${this.settings.rawSubfolder}`;
    }
  }
  // Function to replace text
  private replaceText(editor: Editor, target: string, replacement: string): void {
    target = target.trim();
    let lines = [];
    for (let i = 0; i < editor.lineCount(); i++){
      lines.push(editor.getLine(i));
    }
    for (let i = 0; i < lines.length; i++) {
      const ch = lines[i].indexOf(target)
      if (ch !== -1) {
        const from = { line: i, ch };
        const to = { line: i, ch: ch + target.length };
        editor.replaceRange(replacement, from, to);
        break;
      }
    }
  }

  // Plugin load steps
  async onload(): Promise<void> {
    console.log("loading Cloudinary Uploader");
    await this.loadSettings();
    this.clearHandlers();
    this.setupHandlers();
    this.addSettingTab(new CloudinaryUploaderSettingTab(this.app, this));
  }

  // Plugin shutdown steps
  onunload(): void {
    console.log("unloading Cloudinary Uploader");
    this.clearHandlers();

  }
  // Load settings information
  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  // When saving settings
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.clearHandlers();
    this.setupHandlers();
  }
}
