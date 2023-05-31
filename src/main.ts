// Imports for plugin
import {
    Notice,
    Plugin,
    Editor, MarkdownView,
} from "obsidian";

// For API requests
import axios from "axios"
import objectPath from 'object-path'

// Settings tab import
import CloudinaryUploaderSettingTab from './Settings/settings'
import {CloudinarySettings, DEFAULT_SETTINGS} from "./Settings/settings";


export default class CloudinaryUploader extends Plugin {
    settings: CloudinarySettings;
    private workspace = this.app.workspace;

    //
    private getUploadPresetAndFolder = (file): { uploadFolder: string, uploadPreset: string } => {
        const activeFilePath = this.workspace.getActiveFile().parent.path;
        let result = {uploadPreset: this.settings.globalUploadPreset, uploadFolder: this.settings.globalUploadFolder}
        for (const uf of this.settings.uploadFolders) {
            if (uf.obsidianFolder === activeFilePath) {
                result = {uploadPreset: uf.uploadPreset, uploadFolder: uf.uploadFolder}
                break;
            }
        }
        if (this.settings.segregateContentSeparately){
            if (file.type.startsWith("image")) {
                result.uploadFolder += "/images"
            } else if (file.type.startsWith("video")) {
                result.uploadFolder += "/videos"
            } else if (file.type.startsWith("audio")) {
                result.uploadFolder += "/audios"
            }
        }
        return result;
    }

    // upload files to cloudinary
    private uploadFiles = async (files: FileList, event, editor) => {
        try {
            if (files.length > 0) {
                if (
                    this.settings.cloudName &&
                    Array(...files).filter(file => this.settings.content.contains(file.type.split("/")[0])).length > 0
                ) {
                    for (const file of files) {
                        if (this.settings.content.contains(file.type.split("/")[0])) {
                            // Prevent default paste behaviour
                            event.preventDefault();
                            const randomString = (Math.random() * 10086).toString(36).substr(0, 8)
                            const pastePlaceText = `![uploading...](${randomString})\n`
                            // Generate random string to show on editor screen while API call completes
                            editor.replaceSelection(pastePlaceText)


                            const {uploadPreset, uploadFolder} = this.getUploadPresetAndFolder(file);
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('upload_preset', uploadPreset);
                            formData.append('folder', uploadFolder);


                            // Make API call
                            const {data} = await axios({
                                url: `https://api.cloudinary.com/v1_1/${this.settings.cloudName}/auto/upload`,
                                method: 'POST',
                                data: formData
                            })
                            // Get response public URL of uploaded image
                            let url = objectPath.get(data, 'secure_url')


                            if (file.type.startsWith("image") && this.settings.imageTransformParams !== "") {
                                const splitURL = url.split("/upload/", 2);
                                url = splitURL[0] += "/upload/" + this.settings.imageTransformParams + "/" + splitURL[1];
                            } else if (file.type.startsWith("video") && this.settings.videoTransformParams !== "") {
                                const splitURL = url.split("/upload/", 2);
                                url = splitURL[0] += "/upload/" + this.settings.videoTransformParams + "/" + splitURL[1];
                            } else if (file.type.startsWith("audio") && this.settings.audioTransformParams !== "") {
                                const splitURL = url.split("/upload/", 2);
                                url = splitURL[0] += "/upload/" + this.settings.audioTransformParams + "/" + splitURL[1];
                            }

                            if (this.settings.formatAuto) {
                                const splitURL = url.split("/upload/", 2);
                                url = splitURL[0] += "/upload/f_auto/" + splitURL[1];
                            }

                            if (file.type.startsWith("image")) {
                                const imgMarkdownText = `![${file.name}](${url})\n`
                                this.replaceText(editor, pastePlaceText, imgMarkdownText);
                            } else if (file.type.startsWith("video")) {
                                const videoMarkdownText = `<video controls src="${url}"></video>\n`
                                this.replaceText(editor, pastePlaceText, videoMarkdownText);
                            } else if (file.type.startsWith("audio")) {
                                const audioMarkdownText = `<audio controls src="${url}"></audio>\n`
                                this.replaceText(editor, pastePlaceText, audioMarkdownText);
                            }
                        } else {
                            const fileRef = `![${file.name}](${file.name})\n`
                            editor.replaceSelection(fileRef)
                        }
                    }
                }
            }
        } catch (err) {
            new Notice(err, 5000)
            console.log(err)
        }
    }

    // custom handler for paste event in editor
    private customPasteHandler = async (event: ClipboardEvent, editor: Editor) => {
        const {files} = event.clipboardData;
        await this.uploadFiles(files, event, editor)
    };

    // custom handler for drop event in editor
    private customDropHandler = async (event: DragEvent, editor: Editor) => {
        const {files} = event.dataTransfer;
        await this.uploadFiles(files, event, editor)
    };

    // setup custom handlers
    private setupHandlers() {
        this.registerEvent(this.app.workspace.on('editor-paste', this.customPasteHandler))
        this.registerEvent(this.app.workspace.on('editor-drop', this.customDropHandler))
    }

    // setupPasteHandler(): void {
    // // On paste event, get "files" from clipbaord data
    // // If files contain image, move to API call
    // // if Files empty or does not contain image, throw error
    //   this.registerEvent(this.app.workspace.on('editor-paste',async (evt: ClipboardEvent, editor: Editor)=>{
    //     const { files } = evt.clipboardData;
    //     if(files.length > 0){
    //      if (this.settings.cloudName && this.settings.globalUploadPreset && files[0].type.startsWith("image")) {
    //       evt.preventDefault(); // Prevent default paste behaviour
    //       for (const file of files) {
    //         const randomString = (Math.random() * 10086).toString(36).substr(0, 8)
    //         const pastePlaceText = `![uploading...](${randomString})\n`
    //         editor.replaceSelection(pastePlaceText) // Generate random string to show on editor screen while API call completes
    //
    //         // Cloudinary request format
    //         // Send form data with a file and upload preset
    //         // Optionally define a folder
    //         const formData = new FormData();
    //         formData.append('file',file);
    //         formData.append('upload_preset',this.settings.globalUploadPreset);
    //         formData.append('folder',this.settings.globalUploadFolder);
    //
    //         // Make API call
    //         axios({
    //           url: `https://api.cloudinary.com/v1_1/${this.settings.cloudName}/auto/upload`,
    //           method: 'POST',
    //           data: formData
    //         }).then(res => {
    //         // Get response public URL of uploaded image
    //         console.log(res);
    //           let url = objectPath.get(res.data, 'secure_url')
    //           let imgMarkdownText ="";
    //
    //           // Split URL to allow for appending transformations
    //           if(this.settings.transformParams){
    //             const splitURL = url.split("/upload/",2);
    //             let modifiedURL='';
    //             modifiedURL = splitURL[0]+="/upload/"+this.settings.transformParams+"/"+splitURL[1];
    //             imgMarkdownText = `![](${modifiedURL})`;
    //             url = modifiedURL
    //           }
    //           if(this.settings.formatAutoTrigger){
    //             const splitURL = url.split("/upload/",2);
    //             let modifiedURL='';
    //             modifiedURL = splitURL[0]+="/upload/f_auto/"+splitURL[1];
    //             imgMarkdownText = `![](${modifiedURL})`;
    //
    //           // leave stamdard of no transformations added
    //           }else{
    //           imgMarkdownText = `![](${url})`;
    //           }
    //           // Show MD syntax using uploaded image URL, in Obsidian Editor
    //           this.replaceText(editor, pastePlaceText, imgMarkdownText)
    //         }, err => {
    //         // Fail otherwise
    //           new Notice(err, 5000)
    //           console.log(err)
    //         })
    //       }
    //     }
    //     // else {
    //     // // If not image data, or empty files array
    //     //   new Notice("Cloudinary Image Uploader: Please check the image hosting settings.");
    //     //   editor.replaceSelection("Please check settings for upload\n This will also appear if file is not of image type");
    //     // }
    //
    //   }}))
    // }
    // Function to replace text
    private replaceText(editor: Editor, target: string, replacement: string): void {
        target = target.trim();
        const lines = [];
        for (let i = 0; i < editor.lineCount(); i++) {
            lines.push(editor.getLine(i));
        }
        //const tlines = editor.getValue().split("\n");
        for (let i = 0; i < lines.length; i++) {
            const ch = lines[i].indexOf(target)
            if (ch !== -1) {
                const from = {line: i, ch};
                const to = {line: i, ch: ch + target.length};
                editor.replaceRange(replacement, from, to);
                break;
            }
        }
    }

    // Plugin load steps
    async onload(): Promise<void> {
        console.log("loading Cloudinary Uploader");
        await this.loadSettings();
        // this.setupPasteHandler();
        this.setupHandlers();

        this.addSettingTab(new CloudinaryUploaderSettingTab(this.app, this));
    }

    // Plugin shutdown steps
    onunload(): void {
        console.log("unloading Cloudinary Uploader");

    }

    // Load settings infromation
    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    // When saving settings
    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
}
