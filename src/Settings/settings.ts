/*
 * @Author: Jordan Handy
 */
import {
    App, ButtonComponent,
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
    uploadBasedOnFolderTrigger: false,
    uploadFolders: [{obsidianFolder: "", uploadPreset: "", uploadFolder: ""}],
    globalUploadFolder: null,
    globalUploadPreset: null,
    showSidebarIcon: true,
    formatAutoTrigger: false,
    transformParams: "",
};

export interface CloudinarySettings {
    cloudName: string | null,
    uploadBasedOnFolderTrigger: boolean,
    uploadFolders: Array<UploadFolder>,
    globalUploadFolder: string | null,
    globalUploadPreset: string | null,
    showSidebarIcon: boolean,
    formatAutoTrigger: false,
    transformParams: string | null,
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
        this.toggleUploadBasedOnFolder();
        if (this.plugin.settings.uploadBasedOnFolderTrigger) {
            this.addUploadBasedOnFolder()
        } else {
            this.addGlobalUploadFolder();
            this.addGlobalUploadPreset();
        }
        this.toggleSidebarIcon();
        containerEl.createEl("br")

        containerEl.createEl("div")
        containerEl.createEl("h2", {text: "Transformation Settings"});
        this.toggleFormatAuto();
        this.addTransformPath();
        containerEl.createEl("br")


    }

    addCloudinaryName(): void {
        const desc = document.createDocumentFragment();
        desc.append(
            "Every cloudinary account has a unique cloud name. ",
            desc.createEl("br"),
            "Check the ",
            desc.createEl("a", {
                href: "https://silentvoid13.github.io/Templater/",
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
                                    // log_error(
                                    //     new TemplaterError(
                                    //         "This folder already has a template associated with it"
                                    //     )
                                    // );
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
            "Every upload in vault will go into this cloudinary folder. ",
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
            "Every upload in vault use this upload preset. ",
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

    toggleSidebarIcon(): void {
        const desc = document.createDocumentFragment();
        desc.append(
            "Show cloudinary icon in sidebar.",
        );

        new Setting(this.containerEl)
            .setName("Show Sidebar Icon")
            .setDesc(desc)
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showSidebarIcon)
                    .onChange(async (value) => {
                        this.plugin.settings.showSidebarIcon = value;
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
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.formatAutoTrigger)
                    .onChange(async (value) => {
                        this.plugin.settings.uploadBasedOnFolderTrigger = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

    addTransformPath(): void {
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

        new Setting(this.containerEl)
            .setName("Transformation Params")
            .setDesc(desc)
            .addText((text) =>
                text
                    .setPlaceholder("w_100,h_100,c_fill")
                    .setValue(this.plugin.settings.cloudName)
                    .onChange(async (value) => {
                        this.plugin.settings.transformParams = value;
                        await this.plugin.saveSettings();
                    })
            );
    }

}