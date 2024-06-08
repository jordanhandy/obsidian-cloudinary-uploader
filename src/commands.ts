import {
    Plugin,
    FileSystemAdapter
} from "obsidian";
import { CloudinarySettings } from "./settings-tab";
import { v2 as cloudinary } from 'cloudinary';

export

export default class CloudinaryCommands extends Plugin {
    settings:CloudinarySettings;
    let uploadVault = () => {
        const files = this.app.vault.getFiles()
        console.log('this is a file ' + files[0]);
        for (let i = 0; i < 50; i++) {
            if (files[i].extension != 'md') {
                let path;
                const adapter = this.app.vault.adapter;
                if (adapter instanceof FileSystemAdapter) {
                    path = adapter.getFullPath(files[i].path)
                    console.log(path);
                }
                cloudinary.uploader.unsigned_upload(path, this.settings.uploadPreset, {
                    folder: this.settings.folder
                });
            }
        }
    }
}