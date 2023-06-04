/*
 * @Author: Jordan Handy
 */
import {
    App, ButtonComponent, Notice,
    PluginSettingTab,
    Setting,
} from 'obsidian';

import {FolderSuggest} from "./suggesters/FolderSuggester";

import CloudinaryUploader from '../main'

import {arraymove} from "../utils/utils";

export interface UploadFolder {
    obsidianFolder: string;
    uploadPreset: string;
    uploadFolder: string;
}

export const DEFAULT_SETTINGS: CloudinarySettings = {
    cloudName: null,
    content: ["image"],
    uploadBasedOnFolderTrigger: false,
    uploadFolders: [{obsidianFolder: "", uploadPreset: "", uploadFolder: ""}],
    globalUploadFolder: null,
    globalUploadPreset: null,
    segregateContentSeparately: true,
    formatAuto: true,
    imageTransformParams: "",
    videoTransformParams: "",
    audioTransformParams: "",
};

export interface CloudinarySettings {
    cloudName: string | null,
    content: Array<string>,
    uploadBasedOnFolderTrigger: boolean,
    uploadFolders: Array<UploadFolder>,
    globalUploadFolder: string | null,
    globalUploadPreset: string | null,
    segregateContentSeparately: boolean,
    formatAuto: boolean,
    imageTransformParams: string | null,
    videoTransformParams: string | null,
    audioTransformParams: string | null,
}

export default class CloudinaryUploaderSettingTab extends PluginSettingTab {
    plugin: CloudinaryUploader;

    constructor(app: App, plugin: CloudinaryUploader) {
        super(app, plugin);
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        containerEl.createEl("div")
        containerEl.createEl("h2", {text: "General Settings"});
        this.addCloudinaryName();
        this.addUploadContent();
        this.toggleUploadBasedOnFolder();
        if (this.plugin.settings.uploadBasedOnFolderTrigger) {
            this.addUploadBasedOnFolder()
        }
        this.addGlobalUploadFolder();
        this.addGlobalUploadPreset();

        this.segregateContentSeparately();
        containerEl.createEl("br")

        containerEl.createEl("div")
        containerEl.createEl("h2", {text: "Transformation Settings"});
        this.toggleFormatAuto();
        this.transformationParamsHeaders();
        this.addImageTransformParams();
        this.addVideoTransformParams();
        this.addAudioTransformParams();
        containerEl.createEl("br")


    }

    addCloudinaryName(): void {
        const desc = document.createDocumentFragment();
        desc.append(
            "Every cloudinary account has a unique cloud name. ",
            desc.createEl("br"),
            "Check the ",
            desc.createEl("a", {
                href: "https://cloudinary.com/documentation/cloudinary_glossary#cloud_name",
                text: "documentation",
            }),
            " to get know about cloud name"
        );

        new Setting(this.containerEl)
            .setName("Cloudinary Name")
            .setDesc(desc)
            .addText((text) =>
                text
                    .setPlaceholder("name")
                    .setValue(this.plugin.settings.cloudName)
                    .onChange(async (value) => {
                        this.plugin.settings.cloudName = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

    addUploadContent(): void {
        new Setting(this.containerEl).setName("Upload Content");
        new Setting(this.containerEl)
            .setDesc("Images")
            .addToggle((toggle) => {
                    toggle.setTooltip("Images")
                    toggle
                        .setValue(this.plugin.settings.content.includes("image"))
                        .onChange(async (value) => {
                            if (value) {
                                this.plugin.settings.content.push("image");
                            } else {
                                this.plugin.settings.content = this.plugin.settings.content.filter(item => item !== "image");
                            }
                            await this.plugin.saveSettings();
                        })
                }
            )
        new Setting(this.containerEl)
            .setDesc("Videos")
            .addToggle((toggle) => {
                    toggle.setTooltip("Videos")
                    toggle
                        .setValue(this.plugin.settings.content.includes("video"))
                        .onChange(async (value) => {
                            if (value) {
                                this.plugin.settings.content.push("video");
                            } else {
                                this.plugin.settings.content = this.plugin.settings.content.filter(item => item !== "video");
                            }
                            await this.plugin.saveSettings();
                        })
                }
            )
        new Setting(this.containerEl)
            .setDesc("Audio")
            .addToggle((toggle) => {
                    toggle.setTooltip("Audio")
                    toggle
                        .setValue(this.plugin.settings.content.includes("audio"))
                        .onChange(async (value) => {
                            if (value) {
                                this.plugin.settings.content.push("audio");
                            } else {
                                this.plugin.settings.content = this.plugin.settings.content.filter(item => item !== "audio");
                            }
                            await this.plugin.saveSettings();
                        })
                }
            )
    }

    toggleUploadBasedOnFolder(): void {
        const desc = document.createDocumentFragment();
        desc.append(
            "Upload is triggered when a new ",
            desc.createEl("strong", {text: "empty "}),
            "image is pasted in a folder.",
            desc.createEl("br"),
            "Plugin will upload the file to specified cloudinary folder.",
            desc.createEl("br"),
            "The deepest match is used. A global default template would be defined on the root ",
            desc.createEl("code", {text: "/"}),
            "."
        );

        new Setting(this.containerEl)
            .setName("Upload Configuration Based on Folder")
            .setDesc(desc)
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.uploadBasedOnFolderTrigger)
                    .onChange(async (value) => {
                        this.plugin.settings.uploadBasedOnFolderTrigger = value;
                        await this.plugin.saveSettings();

                        // Force refresh the settings tab display
                        this.display();
                    })
            );
    }

    addUploadBasedOnFolder(): void {
        new Setting(this.containerEl)
            .setName("Add New")
            .setDesc("Add new folder template")
            .addButton((button: ButtonComponent) => {
                button
                    .setTooltip("Add additional folder template")
                    .setButtonText("+")
                    .setCta()
                    .onClick(async () => {
                        this.plugin.settings.uploadFolders.push({
                            obsidianFolder: "",
                            uploadPreset: "",
                            uploadFolder: "",
                        });
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        this.plugin.settings.uploadFolders.forEach(
            (uploadFolder, index) => {
                const s = new Setting(this.containerEl)
                    .addSearch((cb) => {
                        new FolderSuggest(cb.inputEl);
                        cb.setPlaceholder("Obsidian Folder")
                            .setValue(uploadFolder.obsidianFolder)
                            .onChange(async (newFolder) => {
                                if (
                                    newFolder &&
                                    this.plugin.settings.uploadFolders.some(
                                        (e) => e.obsidianFolder == newFolder
                                    )
                                ) {
                                    new Notice("Folder already exists", 3000);
                                    return;
                                }

                                this.plugin.settings.uploadFolders[
                                    index
                                    ].obsidianFolder = newFolder;
                                await this.plugin.saveSettings()
                                this.display();
                            });
                    })
                    .addText((text) => {
                        text.setPlaceholder("Upload Preset")
                            .setValue(uploadFolder.uploadPreset)
                            .onChange(async (newUploadPreset) => {
                                this.plugin.settings.uploadFolders[
                                    index
                                    ].uploadPreset = newUploadPreset;
                                await this.plugin.saveSettings()
                            });
                        text.inputEl.style.width = "30%";
                    })
                    .addText((text) => {
                        text.setPlaceholder("Upload Folder")
                            .setValue(uploadFolder.uploadFolder)
                            .onChange(async (newUploadFolder) => {
                                this.plugin.settings.uploadFolders[
                                    index
                                    ].uploadFolder = newUploadFolder;
                                await this.plugin.saveSettings()
                            });
                        text.inputEl.style.width = "30%";
                    })
                    .addExtraButton((cb) => {
                        cb.setIcon("up-chevron-glyph")
                            .setTooltip("Move up")
                            .onClick(async () => {
                                arraymove(
                                    this.plugin.settings.uploadFolders,
                                    index,
                                    index - 1
                                );
                                await this.plugin.saveSettings()
                                this.display();
                            });
                    })
                    .addExtraButton((cb) => {
                        cb.setIcon("down-chevron-glyph")
                            .setTooltip("Move down")
                            .onClick(async () => {
                                arraymove(
                                    this.plugin.settings.uploadFolders,
                                    index,
                                    index + 1
                                );
                                await this.plugin.saveSettings();
                                this.display();
                            });
                    })
                    .addExtraButton((cb) => {
                        cb.setIcon("cross")
                            .setTooltip("Delete")
                            .onClick(async () => {
                                this.plugin.settings.uploadFolders.splice(
                                    index,
                                    1
                                );
                                await this.plugin.saveSettings();
                                this.display();
                            });
                    });
                s.infoEl.remove();
            }
        );
    }

    addGlobalUploadFolder(): void {
        const desc = document.createDocumentFragment();
        desc.append(
            "Every upload which does not go under the folder specific config in vault use this cloudinary folder. ",
        );

        new Setting(this.containerEl)
            .setName("Global Upload Folder")
            .setDesc(desc)
            .addText((text) =>
                text
                    .setPlaceholder("folder")
                    .setValue(this.plugin.settings.globalUploadFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.globalUploadFolder = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

    addGlobalUploadPreset(): void {
        const desc = document.createDocumentFragment();
        desc.append(
            "Every upload which does not go under the folder specific config in vault use this upload preset. ",
        );

        new Setting(this.containerEl)
            .setName("Global Upload Preset")
            .setDesc(desc)
            .addText((text) =>
                text
                    .setPlaceholder("preset")
                    .setValue(this.plugin.settings.globalUploadPreset)
                    .onChange(async (value) => {
                        this.plugin.settings.globalUploadPreset = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

    segregateContentSeparately(): void {
        const desc = document.createDocumentFragment();
        desc.append(
            "Segregate content in respective child folders.",
        );

        new Setting(this.containerEl)
            .setName("Segregate Content Separately")
            .setDesc(desc)
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.segregateContentSeparately)
                    .onChange(async (value) => {
                        this.plugin.settings.segregateContentSeparately = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

    toggleFormatAuto() {
        const desc = document.createDocumentFragment();
        desc.append(
            "Upload format is set to ",
            desc.createEl("strong", {text: "empty "}),
            "auto",
            desc.createEl("br"),
        );

        new Setting(this.containerEl)
            .setName("Format Auto")
            .setDesc(desc)
            .addToggle((toggle) => {
                    toggle.setValue(this.plugin.settings.formatAuto)
                        .onChange(async (value) => {
                            this.plugin.settings.formatAuto = value;
                            await this.plugin.saveSettings();
                        })
                }
            );
    }

    transformationParamsHeaders(): void {
        const desc = document.createDocumentFragment();
        desc.append(
            "Upload transformations params in comma separated format.",
            desc.createEl("br"),
            "Check the ",
            desc.createEl("a", {
                href: "https://cloudinary.com/documentation/transformation_reference",
                text: "this",
            }),
            " reference by Cloudinary for more information.",
        );
        new Setting(this.containerEl).setName("Transformations Parameters").setDesc(desc);
    }

    addImageTransformParams(): void {
        new Setting(this.containerEl)
            .setName("Image")
            .addText((text) =>
                text
                    .setPlaceholder("w_100,h_100,c_fill")
                    .setValue(this.plugin.settings.imageTransformParams)
                    .onChange(async (value) => {
                        this.plugin.settings.imageTransformParams = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

    addVideoTransformParams(): void {
        new Setting(this.containerEl)
            .setName("Video")
            .addText((text) =>
                text
                    .setPlaceholder("w_100,h_100,c_fill")
                    .setValue(this.plugin.settings.videoTransformParams)
                    .onChange(async (value) => {
                        this.plugin.settings.videoTransformParams = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

    addAudioTransformParams(): void {
        new Setting(this.containerEl)
            .setName("Audio")
            .addText((text) =>
                text
                    .setPlaceholder("ac_aac")
                    .setValue(this.plugin.settings.audioTransformParams)
                    .onChange(async (value) => {
                        this.plugin.settings.audioTransformParams = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

}