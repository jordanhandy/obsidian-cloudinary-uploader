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
    private statusBar: HTMLElement;
    private placeholder: string;
    private isUploading = false;

    private validate = () => {
        if(this.settings.cloudName===""){
            new Notice("☁️ Cloudinary: Cloud Empty ⚠️\nKindly fill cloudinary name & try again", 5000)
            this.isUploading = false;
            this.statusBar.setText("☁️ Cloudinary: Cloud Name Empty ⚠️")
            setTimeout(() => {
                this.statusBar.setText("")
            }, 10000);
            return false;
        }
        if (this.settings.globalUploadPreset===""){
            new Notice("☁️ Cloudinary: Global Upload preset Empty ⚠️\nKindly fill upload preset & try again", 5000)
            this.isUploading = false;
            this.statusBar.setText("☁️ Cloudinary: Global Upload Preset Empty ⚠️")
            setTimeout(() => {
                this.statusBar.setText("")
            }, 10000);
            return false;
        }
        return true;
    }

    private handleUploadingStatusBar = () => {
        this.isUploading = true;
        let counter = 0;
        const intervalId = setInterval(() => {
            if (this.isUploading) {
                counter = (counter + 1) % 4;
                const square = ['⠙', '⠹', '⠸', '⠼'][counter];
                this.statusBar.setText("☁️ Cloudinary: Uploading... " + `${square}`)
            }
        }, 200)
        if (!this.isUploading) {
            clearInterval(intervalId)
        }
        this.statusBar.setText("")
    }

    private handleUploadSuccess = () => {
        this.isUploading = false;
        this.statusBar.setText("☁️ Cloudinary: Uploaded ✅")
        setTimeout(() => {
            this.statusBar.setText("")
        }, 3000)
    }

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
        if (this.settings.segregateContentSeparately) {
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
        if(!this.validate()){
            return;
        }
        if (files.length > 0) {
            if (
                this.settings.cloudName &&
                Array(...files).filter(file => this.settings.content.contains(file.type.split("/")[0])).length > 0
            ) {
                for (const file of files) {
                    try {
                        if (this.settings.content.contains(file.type.split("/")[0])) {
                            // Prevent default paste behaviour
                            event.preventDefault();

                            // Loading Status
                            const randomString = (Math.random() * 10086).toString(36).substr(0, 8)
                            const pastePlaceText = `![uploading...](${randomString})\n`
                            // Generate random string to show on editor screen while API call completes
                            editor.replaceSelection(pastePlaceText)
                            this.placeholder = pastePlaceText
                            this.handleUploadingStatusBar()


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

                            this.handleUploadSuccess()
                            if (file.type.startsWith("image")) {
                                const imgMarkdownText = `![${file.name}](${url})\n`
                                this.replaceText(editor, imgMarkdownText);
                            } else if (file.type.startsWith("video")) {
                                const videoMarkdownText = `<video controls src="${url}"></video>\n`
                                this.replaceText(editor, videoMarkdownText);
                            } else if (file.type.startsWith("audio")) {
                                const audioMarkdownText = `<audio controls src="${url}"></audio>\n`
                                this.replaceText(editor, audioMarkdownText);
                            }
                        } else {
                            const fileRef = `![${file.name}](${file.name})\n`
                            editor.replaceSelection(fileRef)
                        }
                    } catch (err) {
                        if (err.response.status === 401) {
                            new Notice("☁️ Cloudinary: Cloud not found ⛔\nKindly check cloudinary name & try again", 5000)
                            this.isUploading = false;
                            this.statusBar.setText("☁️ Cloudinary: Cloud Name Not Found ⛔️")
                        } else if (err.response.status === 400) {
                            new Notice("☁️ Cloudinary: Upload Preset Not Found ⛔️\nKindly check upload preset & try again", 5000)
                            this.isUploading = false;
                            this.statusBar.setText("☁️ Cloudinary: Cloud Preset Not Found ⛔️")
                        } else {
                            new Notice("☁️ Cloudinary: Upload Failed ⛔️\nKindly check settings & try again", 5000)
                            this.isUploading = false;
                            this.statusBar.setText("☁️ Cloudinary: Upload Failed ❌")
                        }
                        setTimeout(() => {
                            this.statusBar.setText("")
                        }, 5000)
                        this.replaceText(this.workspace.activeEditor.editor, `![${file.name}](${file.name})\n`)
                    }
                }
            }

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


    private replaceText(editor: Editor, replacement: string): void {
        const target = this.placeholder.trim();
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
        new Notice("Cloudinary plugin is loaded", 5000)
        await this.loadSettings();
        // this.setupPasteHandler();
        this.setupHandlers();
        this.addSettingTab(new CloudinaryUploaderSettingTab(this.app, this));
        this.statusBar = this.addStatusBarItem();
    }

    // Plugin shutdown steps
    onunload(): void {
        new Notice("Cloudinary plugin is unloaded", 5000)
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
