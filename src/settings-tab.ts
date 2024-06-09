/*
 * @Author: Jordan Handy
 */
import {
    App,
    PluginSettingTab,
    Setting,
} from 'obsidian';

import CloudinaryUploader from './main'

//Define Cloudinary Settings
export interface CloudinarySettings {
        cloudName: string;
        uploadPreset: string;
        folder: string;
        f_auto: boolean;
        transformParams: string;
        dropUpload: boolean;
        clipboardUpload: boolean;
        imageUpload: boolean;
        audioUpload: boolean;
        videoUpload: boolean;
        rawUpload: boolean;
        imageSubfolder: string;
        audioSubfolder: string;
        videoSubfolder: string;
        rawSubfolder: string;
        preserveBackupFilePath: boolean;
        backupFolder: string;
        ignoreWarnings: boolean;
    }
export const DEFAULT_SETTINGS: CloudinarySettings = {
    cloudName: "",
    uploadPreset: "",
    folder: "",
    f_auto: false,
    transformParams: "",
    dropUpload: false,
    clipboardUpload: true,
    imageUpload: true,
    audioUpload: false,
    videoUpload: false,
    rawUpload: false,
    imageSubfolder: "",
    audioSubfolder: "",
    videoSubfolder: "",
    rawSubfolder: "",
    preserveBackupFilePath: false,
    backupFolder: "",
    ignoreWarnings: false
};
export default class CloudinaryUploaderSettingTab extends PluginSettingTab {
  
  // Set settings defaults


    plugin: CloudinaryUploader;
    constructor(app: App, plugin: CloudinaryUploader) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl("h3", { text: "Cloudinary Settings" });

        new Setting(containerEl)
            .setName("Cloud Name")
            .setDesc("The name of your Cloudinary Cloud Account")
            .addText((text) => {
                text
                    .setPlaceholder("")
                    .setValue(this.plugin.settings.cloudName)
                    .onChange(async (value) => {
                        this.plugin.settings.cloudName = value;
                        await this.plugin.saveSettings();
                    })
            }
            );

        new Setting(containerEl)
            .setName("Cloudinary Upload Template")
            .setDesc("Cloudinary Upload Preference string")
            .addText((text) => {
                text
                    .setPlaceholder("")
                    .setValue(this.plugin.settings.uploadPreset)
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.uploadPreset = value;
                            await this.plugin.saveSettings();
                        }
                        catch (e) {
                            console.log(e)
                        }
                    })
            });
            new Setting(containerEl)
            .setName("Cloudinary Root Upload Folder")
            .setDesc("Folder name to use in Cloudinary.  Note, this will be ignored if you have a folder set in your Cloudinary Upload Preset")
            .addText((text) => {
                text
                    .setPlaceholder("obsidian")
                    .setValue(this.plugin.settings.folder)
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.folder = value;
                            await this.plugin.saveSettings();
                        }
                        catch (e) {
                            console.log(e)
                        }
                    })
            });
            containerEl.createEl("h4", { text: "Paste Behaviour" });
            new Setting(containerEl)
            .setName("Upload on Clipboard Copy/Paste")
            .setDesc("Upload files on a copy/paste from clipboard")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.clipboardUpload)
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.clipboardUpload = value;
                            await this.plugin.saveSettings();
                        }
                        catch (e) {
                            console.log(e)
                        }
                    })
            });
            new Setting(containerEl)
            .setName("Upload on Drag/Drop")
            .setDesc("Upload files on a drag/drop")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.dropUpload)
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.dropUpload = value;
                            await this.plugin.saveSettings();
                        }
                        catch (e) {
                            console.log(e)
                        }
                    })
            });


            containerEl.createEl("h4", { text: "URL Manipulations / Transformation" });
            
            // Allow for inline hyperlinks with anchor tags
            let textFragment = document.createDocumentFragment();
            let link = document.createElement("a"); 

            const linkTransformation = document.createElement("a"); 
            linkTransformation.text="transformation limits ";
            linkTransformation.href="https://cloudinary.com/documentation/transformation_counts";
            
            textFragment.append("The settings below are meant for default image transformations.  As they only touch the resulting URL, this should not cause any upload errors, however, if syntax is incorrect, your images will not be referenced correctly (won't render).  Be mindful of your Cloudinary ");
            textFragment.append(linkTransformation);
            textFragment.append(" and use the ");
            
            link.href = "https://cloudinary.com/documentation/transformation_reference";
            link.text = " Cloudinary documentation"
            textFragment.append(link);
            textFragment.append(" for guidance.");
            containerEl.createEl("p", { text: textFragment });


            textFragment = document.createDocumentFragment();
            link = document.createElement("a");
            link.href="https://cloudinary.com/documentation/image_optimization#automatic_format_selection_f_auto";
            link.text="f_auto option";
            textFragment.append("Enable the ");
            textFragment.append(link);
            textFragment.append(" for uploads");

            new Setting(containerEl)
            .setName("f_auto Option")
            .setDesc(textFragment)
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.f_auto)
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.f_auto = value;
                            await this.plugin.saveSettings();
                        }
                        catch (e) {
                            console.log(e)
                        }
                    })
            });
            textFragment = document.createDocumentFragment();
            link = document.createElement("a");
            link.href="https://cloudinary.com/documentation/transformation_reference";
            link.text="View Cloudinary's transformation reference for guidance.";
            textFragment.append("Add a comma-delimited default set of transformations to your uploads.  You do NOT need to include f_auto here if already enabled above.  ");
            textFragment.append(link);
            new Setting(containerEl)
            .setName("Default Transformation Parameters")
            .setDesc(textFragment)
            .addText((text) => {
                text
                    .setPlaceholder("w_150,h_150")
                    .setValue(this.plugin.settings.transformParams)
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.transformParams = value;
                            await this.plugin.saveSettings();
                        }
                        catch (e) {
                            console.log(e)
                        }
                    })
            });
            containerEl.createEl("h4", { text: "Enabled File Types" });
            textFragment = document.createDocumentFragment();
            textFragment.append("Choose which file types are uploaded to Cloudinary.  Disabled types are ignored");
            containerEl.createEl("p", { text: textFragment });

            new Setting(containerEl)
            .setName("Upload Images")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.imageUpload)
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.imageUpload = value;
                            await this.plugin.saveSettings();
                        }
                        catch (e) {
                            console.log(e)
                        }
                    })
            });
            new Setting(containerEl)
            .setName("Upload Audio")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.audioUpload)
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.audioUpload = value;
                            await this.plugin.saveSettings();
                        }
                        catch (e) {
                            console.log(e)
                        }
                    })
            });
            new Setting(containerEl)
            .setName("Upload Video")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.videoUpload)
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.videoUpload = value;
                            await this.plugin.saveSettings();
                        }
                        catch (e) {
                            console.log(e)
                        }
                    })
            });
            new Setting(containerEl)
            .setName("Upload Raw Files")
            .setDesc("Raw files are those files that are not necessarily media files, but Cloudinary will still accept for upload")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.rawUpload)
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.rawUpload = value;
                            await this.plugin.saveSettings();
                        }
                        catch (e) {
                            console.log(e)
                        }
                    })
            });
            containerEl.createEl("h4", { text: "File Type Subfolders" });
            textFragment = document.createDocumentFragment();
            textFragment.append("Choose to add subfolders for different asset types.  If not specified, will upload all files in the root folder.  As mentioned above, this setting will be ignored if you have a default folder set in Cloudinary's settings for your upload preset");
            containerEl.createEl("p", { text: textFragment });

            new Setting(containerEl)
            .setName("Image Subfolder")
            .setDesc("Subfolder name for image files")
            .addText((text) => {
                text
                    .setPlaceholder("image")
                    .setValue(this.plugin.settings.imageSubfolder)
                    .onChange(async (value) => {
                        this.plugin.settings.imageSubfolder = value;
                        await this.plugin.saveSettings();
                    })
            });
            new Setting(containerEl)
            .setName("Audio Subfolder")
            .setDesc("Subfolder name for audio files")
            .addText((text) => {
                text
                    .setPlaceholder("audio")
                    .setValue(this.plugin.settings.audioSubfolder)
                    .onChange(async (value) => {
                        this.plugin.settings.audioSubfolder = value;
                        await this.plugin.saveSettings();
                    })
            });
            new Setting(containerEl)
            .setName("Video Subfolder")
            .setDesc("Subfolder name for video files")
            .addText((text) => {
                text
                    .setPlaceholder("video")
                    .setValue(this.plugin.settings.videoSubfolder)
                    .onChange(async (value) => {
                        this.plugin.settings.videoSubfolder = value;
                        await this.plugin.saveSettings();
                    })
            });
            new Setting(containerEl)
            .setName("Raw Subfolder")
            .setDesc("Subfolder name for raw files")
            .addText((text) => {
                text
                    .setPlaceholder("raw")
                    .setValue(this.plugin.settings.rawSubfolder)
                    .onChange(async (value) => {
                        this.plugin.settings.rawSubfolder = value;
                        await this.plugin.saveSettings();
                    })
            });
            containerEl.createEl("h4", { text: "Local File Backup" });
            textFragment = document.createDocumentFragment();
            textFragment.append("If you run the command to create a backup of vault local assets, these settings apply");
            containerEl.createEl("p", { text: textFragment });

            new Setting(containerEl)
            .setName("Backup folder")
            .setDesc("Root folder where backups are stored.  If not specified and you run a backup, root is specified as the root of your Cloudinary media library")
            .addText((text) => {
                text
                    .setPlaceholder("backups")
                    .setValue(this.plugin.settings.backupFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.backupFolder = value;
                        await this.plugin.saveSettings();
                    })
            });

            new Setting(containerEl)
            .setName("Preserve File Paths")
            .setDesc("Preserve vault file path relative to root backup folder.  If disabled, assets will be placed in 'root', whether the above backup folder or root of Cloudinary Media library")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.preserveBackupFilePath)
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.preserveBackupFilePath = value;
                            await this.plugin.saveSettings();
                        }
                        catch (e) {
                            console.log(e)
                        }
                    })
            });
            containerEl.createEl("h5", { text: "File names, file conflicts, overwrite behaviour" });
            link = document.createElement("a"); 
            link.text="plugin documentation ";
            link.href="https://google.ca";
            textFragment = document.createDocumentFragment();
            textFragment.append("Assuming all defaults in your Cloudinary Upload Preset settings, all file backups will receive a unique public ID (file name) within the Cloudinary console."+
            "  This may make it hard to identify.  Additionally, file uploads will always be overwritten.  You can use a combination of settings for unique file naming as found in ");
            textFragment.append(link);
            containerEl.createEl("p", { text: textFragment });


            containerEl.createEl("h4", { text: "Warnings" });
            new Setting(containerEl)
            .setName("Hide command palette mass upload warning")
            .setDesc("Hides the warning modal and assumes that all mass actions are approved")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.ignoreWarnings)
                    .onChange(async (value) => {
                        try {
                            this.plugin.settings.ignoreWarnings = value;
                            await this.plugin.saveSettings();
                        }
                        catch (e) {
                            console.log(e)
                        }
                    })
            });
    }
}