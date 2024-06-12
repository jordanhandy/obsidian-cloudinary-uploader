import {Notice,FileSystemAdapter, TFile} from 'obsidian';
import path from 'path';
import objectPath from 'object-path'
import { NoteWarningModal } from '../note-warning-modal';
import { v2 as cloudinary } from 'cloudinary';
import { audioFormats, videoFormats, imageFormats } from '../formats';
import CloudinaryUploader from '../main';
import { CloudinarySettings } from '../settings-tab';

export function uploadNoteModal(file?: TFile, type?: string,plugin:CloudinaryUploader): void {
    new NoteWarningModal(this.app, type, (result): void => {
      if (result == 'true') {
        if (file) {
            uploadCurrentNoteFiles(file,plugin);
          return;
        } else {
          if (type == 'asset') {
            uploadVault(plugin);
            return;
          } else if (type == 'note') {
            const files = this.app.vault.getMarkdownFiles()
            for (let file of files) {
                uploadCurrentNoteFiles(file,plugin);
            }

          }
        }
      } else {
        return;
      }

    }).open();
  }

export function uploadVault(plugin:CloudinaryUploader): void {

    const files = this.app.vault.getFiles()
    for (let file of files) {
      if (file.extension != 'md') {
        let filePath;
        const adapter = this.app.vault.adapter;
        if (adapter instanceof FileSystemAdapter) {
          filePath = adapter.getFullPath(file.path);
          console.log(filePath);
        }
        cloudinary.uploader.unsigned_upload(filePath, plugin.settings.uploadPreset, {
          folder: settings.preserveBackupFilePath ? path.join(settings.backupFolder, path.dirname(file.path)) : settings.backupFolder,
          resourceType: 'auto'
        });
      }
    }
  }
  export function uploadCurrentNoteFiles(file: TFile, plugin: CloudinaryUploader): void {
    let data = this.app.vault.cachedRead(file).then((result) => {
      data = result;
    }).then(() => {
      const found = data.match(/\!\[\[(?!https?:\/\/).*?\]\]/g);
      if (found && found.length > 0) for (let find of found) {
        let fileString = find.substring(3, find.length - 2);
        let filePath;
        const adapter = this.app.vault.adapter;
        if (adapter instanceof FileSystemAdapter) {
          filePath = adapter.getFullPath(fileString)
          cloudinary.uploader.unsigned_upload(filePath, plugin.settings.uploadPreset, {
            folder: setSubfolder(undefined, filePath,plugin),
            resource_type: 'auto'
          }).then(res => {
            console.log(res);
            let url = objectPath.get(res, 'secure_url');
            let resType = objectPath.get(res, 'resource_type');
            url = generateTransformParams(url,plugin);
            let replaceMarkdownText = generateResourceUrl(resType, url);
            data = data.replace(find, replaceMarkdownText);
            this.app.vault.process(file, () => {
              return data;
            })
            new Notice("Upload of note files was completed");
          }, err => {
            console.log(JSON.stringify(err))
            new Notice("There was something wrong with your upload.  Please try again. " + file.name + '. ' + err.message, 0);
          })
        }
      }
    });
  }
  export function generateTransformParams(url: string, plugin:CloudinaryUploader): string {
    if (plugin.settings.transformParams) {
      const splitURL = url.split("/upload/", 2);
      url = splitURL[0] += "/upload/" + plugin.settings.transformParams + "/" + splitURL[1];
    }
    if (plugin.settings.f_auto) {
      const splitURL = url.split("/upload/", 2);
      url = splitURL[0] += "/upload/f_auto/" + splitURL[1];
      // leave standard of no transformations added
    }
    return url;
  }
  export function generateResourceUrl(type: string, url: string): string {
    if (type == 'audio' || isType(url, audioFormats)) {
      return `<audio src="${url}" controls></audio>\n`;
    } else if (type == 'video' || isType(url, videoFormats)) {
      return `<video src="${url}" controls></video>\n`;
    } else {
      return `![](${url})`;
    }
  }
    // Required as Cloudinary doesn't have an 'audio' resource type.
  // As we only know the file type after it's been uploaded (we don't know MIME type),
  // we check if audio was uploaded based on the most-commonly used audio formats
  export function isType(url: string, formats: string[]): boolean {
    let foundTypeMatch = false;
    for (let format of formats) {
      if (url.endsWith(format)) {
        foundTypeMatch = true;
      }
    }
    return foundTypeMatch;
  }
  export function setSubfolder(file: File, resourceUrl: string,settings:CloudinaryUploader): string {
    if (file) {
      if (file.type && file.type.startsWith("image")) {
        return `${settings.folder}/${settings.imageSubfolder}`;
      } else if (file.type.startsWith("audio")) {
        return `${settings.folder}/${settings.audioSubfolder}`;
      } else if (file.type.startsWith("video")) {
        return `${settings.folder}/${settings.videoSubfolder}`;
      } else {
        return `${settings.folder}/${settings.rawSubfolder}`;
      }
    } else if (resourceUrl) {
      if (isType(resourceUrl, imageFormats)) {
        return `${settings.folder}/${settings.imageSubfolder}`;
      } else if (isType(resourceUrl, audioFormats)) {
        return `${settings.folder}/${settings.audioSubfolder}`;
      } else if (isType(resourceUrl, videoFormats)) {
        return `${settings.folder}/${settings.videoSubfolder}`;
      } else {
        return `${settings.folder}/${settings.rawSubfolder}`;
      }
    }

  }
  