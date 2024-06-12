/*--------- Utilities for Commands and async uploads -----------*/

import { Notice, FileSystemAdapter, TFile } from 'obsidian';
import path from 'path';
import objectPath from 'object-path'
import { NoteWarningModal } from '../note-warning-modal';
import { v2 as cloudinary } from 'cloudinary';
import { audioFormats, videoFormats, imageFormats } from '../formats';
import CloudinaryUploader from '../main';

// Generates a modal when command is invoked
// References 'plugin' as we need access to settings on Cloudinary Uploader
export function uploadNoteModal(file?: TFile, type: string, plugin: CloudinaryUploader): void {
  new NoteWarningModal(plugin.app, type, (result): void => {
    if (result == 'true') {
      if (file) {
        uploadCurrentNoteFiles(file, plugin); // If a file was passed and modal agreed
        return;
      } else {
        // If no file passed, but assets were to be uploaded
        if (type == 'asset') {
          uploadVault(plugin); // Upload vault function
          return;
        } else if (type == 'note') {  //! If no file passed, but 'notes' to be uploaded, this means all notes are requested.
          const files = plugin.app.vault.getMarkdownFiles()
          for (let file of files) {
            uploadCurrentNoteFiles(file, plugin);
          }

        }
      }
    } else {
      return;
    }

  }).open();
}

export function uploadVault(plugin: CloudinaryUploader): void {

  const files = plugin.app.vault.getFiles()
  for (let file of files) {
    if (file.extension != 'md') {
      let filePath;
      const adapter = plugin.app.vault.adapter;
      if (adapter instanceof FileSystemAdapter) {
        filePath = adapter.getFullPath(file.path);
        console.log(filePath);
      }
      cloudinary.uploader.unsigned_upload(filePath, plugin.settings.uploadPreset, {
        folder: plugin.settings.preserveBackupFilePath ? path.join(plugin.settings.backupFolder, path.dirname(file.path)) : plugin.settings.backupFolder,
        resourceType: 'auto'
      });
    }
  }
}
export function uploadCurrentNoteFiles(file: TFile, plugin: CloudinaryUploader): void {
  let data = plugin.app.vault.cachedRead(file).then((result) => {
    data = result;
  }).then(() => {
    const found = data.match(/\!\[\[(?!https?:\/\/).*?\]\]/g);
    if (found && found.length > 0) for (let find of found) {
      let fileString = find.substring(3, find.length - 2);
      let filePath;
      const adapter = plugin.app.vault.adapter;
      if (adapter instanceof FileSystemAdapter) {
        filePath = adapter.getFullPath(fileString)
        cloudinary.uploader.unsigned_upload(filePath, plugin.settings.uploadPreset, {
          folder: setSubfolder(undefined, filePath, plugin),
          resource_type: 'auto'
        }).then(res => {
          console.log(res);
          let url = objectPath.get(res, 'secure_url');
          let resType = objectPath.get(res, 'resource_type');
          url = generateTransformParams(url, plugin);
          let replaceMarkdownText = generateResourceUrl(resType, url);
          data = data.replace(find, replaceMarkdownText);
          plugin.app.vault.process(file, () => {
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
export function generateTransformParams(url: string, plugin: CloudinaryUploader): string {
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
export function setSubfolder(file: File, resourceUrl: string, settings: CloudinaryUploader): string {
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