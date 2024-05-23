/*
 * @Author: Jordan Handy
 */
import {
    App,
    PluginSettingTab,
    Setting,
} from 'obsidian';

import CloudinaryUploader from './main'

export default class CloudinaryUploaderSettingTab extends PluginSettingTab {
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
            .setName("Cloudinary Upload Folder")
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
    }
}