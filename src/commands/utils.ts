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
          fetchMessages(plugin);
          //uploadVault(plugin); // Upload vault function
          return;
        } else if (type == 'note') {  //! If no file passed, but 'notes' to be uploaded, this means all notes are requested.     
          uploadAllNotes(plugin).then((returns) => {
            let errorFlag = false;
            if (returns.length > 0) {
              for (let msgs of returns) {
                if (msgs.length > 0) {
  
                  // If errors
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
    } else {
      return;
    }

  }).open();
}
// This function used to upload mass note files
export async function uploadAllNotes(plugin:CloudinaryUploader): Promise<string[]> {
  let returnData = []
  const files = plugin.app.vault.getMarkdownFiles()
    for (let file of files) {
      await uploadCurrentNoteFiles(file, plugin).then((res) => {
        returnData.push(res);
      });
    }
    return returnData;
}


export async function uploadVault(plugin: CloudinaryUploader): Promise<string[][]> {
  let successMessages = [];
  let failureMessages = [];
  //* Get all files in vault that are not
  //* MD files, so they may be uploaded
  const files = plugin.app.vault.getFiles()
  new Notice("Upload of vault files started.  Depending on your vault size, this could take a long while.  Watch for error or success notices",0);
  for (let file of files) {
    if (file.extension != 'md') {
      let filePath;
      const adapter = plugin.app.vault.adapter;
      if (adapter instanceof FileSystemAdapter) {
        filePath = adapter.getFullPath(file.path);
      }
      await cloudinary.uploader.unsigned_upload(filePath, plugin.settings.uploadPreset, {
        folder: plugin.settings.preserveBackupFilePath ? path.join(plugin.settings.backupFolder, path.dirname(file.path)) : plugin.settings.backupFolder,
        resource_type: 'auto'
      }).then(res=>{
        // add to success messages array
        successMessages.push('success')
      },err=>{
        // add to failure messages array
        failureMessages.push(err.message);
      });
    }
  }
  // send messages
  return [successMessages,failureMessages];
}

//* This function fetches messages from the mass upload job
//* as this could take a while if the vault is larger
export async function fetchMessages(plugin:CloudinaryUploader) : Promise<void>{
  // After the upload action completes then
  // retrieve data and display messages based on results.
  uploadVault(plugin).then((data)=>{
    if(data[0].length > 0 && data[1].length > 0){
      new Notice("Cloudinary vault asset backup: There was some success in uploading vault files, as well as some errors.  Open Developer Tools for error information in Console",0);
      for(let msg of data[1]){
        console.warn(msg);
      }
    }else if(data[0].length >0){
      new Notice("Cloudinary vault asset backup: This was successfully completed.  No errors to report",0);
    }else if(data[1].length > 0){
      new Notice("Cloudinary vault asset backup: This operation failed. Please try again",0);
    }
  });
}
export async function uploadCurrentNoteFiles(file: TFile, plugin: CloudinaryUploader): Promise<string[][]> {
  let successMessages = [];
  let failureMessages = [];
  //! Read a cached version of the file, then:
  /*
  * Find a RegEx match for [[]] file refs
  * Get file name and find full path of file
  * Pass full path to Cloudinary for upload
  * Based on answer returned, determine subfolder, then:
  * Replace current strings with Cloudinary URLs
  */
  let data = plugin.app.vault.cachedRead(file).then((data) => {
    const found = data.match(/\!\[\[(?!https?:\/\/).*?\]\]/g);
    if (found && found.length > 0) for (let find of found) {
      let fileString = find.substring(3, find.length - 2);
      let filePath;
      const adapter = plugin.app.vault.adapter;
      if (adapter instanceof FileSystemAdapter) {
        filePath = adapter.getFullPath(fileString);
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
          successMessages.push('success')
          //new Notice("Upload of note file was completed"); // Success
        }, err => {
          failureMessages.push('error uploading file: '+filePath+'  '+err.message);
          // Failure
          //new Notice("There was something wrong with your upload.  Please try again. " + file.name + '. ' + err.message, 0);
        })
      }
    }
  });
  return failureMessages;
}
// Called to generate the output of the transformation parameters
// that are set on uploads
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
// Once upload completes, generate the resulting getMarkdown
// that will be written to file
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
// Determine the subfolder to place the uploaded
// file in, based on file type uploaded
export function setSubfolder(file: File, resourceUrl: string, plugin: CloudinaryUploader): string {
  let result="";
  if (file) {
    if (file.type && file.type.startsWith("image") && plugin.settings.imageSubfolder) {
      result = `${plugin.settings.imageSubfolder}`;
    } else if (file.type.startsWith("audio") && plugin.settings.audioSubfolder) {
      result = `${plugin.settings.audioSubfolder}`;
    } else if (file.type.startsWith("video") && plugin.settings.videoSubfolder ) {
      result = `${plugin.settings.videoSubfolder}`;
    } else if(plugin.settings.rawSubfolder) {
      result = `${plugin.settings.rawSubfolder}`;
    }
  } else if (resourceUrl) {
    if (isType(resourceUrl, imageFormats) && plugin.settings.imageSubfolder) {
      result = `${plugin.settings.folder}/${plugin.settings.imageSubfolder}`;
    } else if (isType(resourceUrl, audioFormats) && plugin.settings.audioSubfolder) {
      result = `${plugin.settings.folder}/${plugin.settings.audioSubfolder}`;
    } else if (isType(resourceUrl, videoFormats) && plugin.settings.videoSubfolder) {
      result = `${plugin.settings.folder}/${plugin.settings.videoSubfolder}`;
    } else if(plugin.settings.rawSubfolder) {
      result = `${plugin.settings.folder}/${plugin.settings.rawSubfolder}`;
    }
  }
  if(plugin.settings.folder && result != ""){
    result = `${plugin.settings.folder}/${result}`
  }else if(!plugin.settings.folder && result != ""){
    result = `${result}`
  }else if(plugin.settings.folder){
    result = `${plugin.settings.folder}`;
  }else{
    result ="";
  }
  return result;

}
