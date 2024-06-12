// Imports for plugin
import {
  Notice,
  Plugin,
  Editor,
} from "obsidian";

// For API requests
import axios from "axios"
import objectPath from 'object-path'
import { v2 as cloudinary } from 'cloudinary';
import { uploadNoteModal, uploadCurrentNoteFiles, setSubfolder, generateResourceUrl, generateTransformParams, fetchMessages, uploadAllNotes } from "./commands/utils";


// Settings tab import
import CloudinaryUploaderSettingTab from './settings-tab'
import { DEFAULT_SETTINGS, CloudinarySettings } from "./settings-tab";
export default class CloudinaryUploader extends Plugin {
  settings: CloudinarySettings;

  private setCommands(): void {
    this.addCommand({
      id: "upload-single-note-files-to-cloudinary",
      name: "Upload files in current note to Cloudinary",
      callback: () => {
        let file = this.app.workspace.getActiveFile();
        if (this.settings.ignoreWarnings) {
          uploadCurrentNoteFiles(file, this);
        } else {
          uploadNoteModal(file, 'note', this);

        }
      }
    });
    this.addCommand({
      id: "upload-all-note-files-cloudinary",
      name: "Upload all note files to Cloudinary",
      callback: () => {
        if(this.settings.ignoreWarnings){
        uploadAllNotes(this).then((returns) => {
          let errorFlag = false;
          if (returns.length > 0) {
            for (let msgs of returns) {
              if (msgs.length > 0) {
                errorFlag = true
                new Notice("There were errors completing your operation.  Please look at the developer console for further information", 0);
                for (let msg of msgs) {
                  console.warn(msg);
                }
              }

            }
          } if (!errorFlag) {
            new Notice("The operation is complete.  No errors to report", 0);
          }
        });

      }
    }
    });
    this.addCommand({
      id: "upload-all-media-assets-cloudinary",
      name: "Upload all vault media assets to Cloudinary",
      callback: () => {
        if (this.settings.ignoreWarnings) {
          //async fetch messages after upload of vault assets
          fetchMessages(this);
        } else {
          uploadNoteModal(undefined, 'asset', this);
        }
      }
    });
  }

  private clearHandlers(): void {
    this.app.workspace.off('editor-paste', this.pasteHandler);
    this.app.workspace.off('editor-drop', this.dropHandler);
  }

  private setupHandlers(): void {
    if (this.settings.clipboardUpload) {
      this.registerEvent(this.app.workspace.on('editor-paste', this.pasteHandler));
    } else {
      this.app.workspace.off('editor-paste', this.pasteHandler);
    }
    if (this.settings.dropUpload) {
      this.registerEvent(this.app.workspace.on('editor-drop', this.dropHandler));
    } else {
      this.app.workspace.off('editor-drop', this.dropHandler);
    }
  }
  private pasteHandler = async (event: ClipboardEvent, editor: Editor): Promise<void> => {
    const { files } = event.clipboardData;
    await this.uploadFiles(files, event, editor); // to fix
  }
  private dropHandler = async (event: DragEventInit, editor: Editor): Promise<void> => {
    const { files } = event.dataTransfer;
    await this.uploadFiles(files, event, editor); // to fix
  }

  private uploadFiles = async (files: FileList, event, editor) => {

    // On paste event, get "files" from clipbaord or drag data
    // If files contain image, video, or audio move to API call
    // if Files empty or does not contain above, then keep default paste behaviour
    if (files.length > 0) {
      if (this.settings.cloudName && this.settings.uploadPreset) {

        if ((this.settings.audioUpload && files[0].type.startsWith("audio")) ||
          (this.settings.videoUpload && files[0].type.startsWith('video')) ||
          (this.settings.imageUpload && files[0].type.startsWith('image')) ||

          (this.settings.rawUpload && !files[0].type.startsWith('image')) &&
          !files[0].type.startsWith('audio') && !files[0].type.startsWith('video')) {
          event.preventDefault(); // Prevent default paste behaviour

          for (let file of files) {
            const randomString = (Math.random() * 10086).toString(36).substr(0, 8)
            const pastePlaceText = `![uploading...](${randomString})\n`
            editor.replaceSelection(pastePlaceText) // Generate random string to show on editor screen while API call completes
            // Cloudinary request format
            // Send form data with a file and upload preset
            // Optionally define a folder
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', this.settings.uploadPreset);
            formData.append('folder', this.settings.folder != '' ? setSubfolder(file, undefined, this) : '');

            // Make API call
            axios({
              url: `https://api.cloudinary.com/v1_1/${this.settings.cloudName}/auto/upload`,
              method: 'POST',
              data: formData
            }).then(res => {
              // Get response public URL of uploaded image
              console.log(res);
              let url = objectPath.get(res.data, 'secure_url');
              let resType = objectPath.get(res.data, 'resource_type');
              // Split URL to allow for appending transformations
              url = generateTransformParams(url, this);
              let replaceMarkdownText = generateResourceUrl(file.type, url);
              // Show MD syntax using uploaded image URL, in Obsidian Editor
              this.replaceText(editor, pastePlaceText, replaceMarkdownText)
            }, err => {
              // Fail otherwise
              new Notice("There was something wrong with the upload.  PLease check your cloud name and template name before trying again " + err, 5000)
              console.log(err)
            })
          }
        }
      } else {
        // Failure
        new Notice("It looks like your Cloudinary Cloud Name or Upload Preset were not defined.  Uploads to Cloudinary will fail if these are not set.  Please visit plugin settings, or disable plugin to stop this error. Falling back to default paste behaviour", 0);
      }
    }
  }


  // Function to replace text
  private replaceText(editor: Editor, target: string, replacement: string): void {
    target = target.trim();
    let lines = [];
    for (let i = 0; i < editor.lineCount(); i++) {
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

    // Set cloudinary cloud name config for node module
    cloudinary.config({
      cloud_name: this.settings.cloudName
    });
    this.setCommands();
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