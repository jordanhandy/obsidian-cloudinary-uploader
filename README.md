# Cloudinary

## What is it?
[Cloudinary](https://cloudinary.com/) is a cloud storage platform that allows you to upload various media files to a storage account.  The media files within this storage account can then be manipulated using Cloudinary's APIs to manipulate the data properties and metadata.

This plugin will make all files (images, video, audio) dragged or pasted in the editor, upload to Cloudinary Media Library rather than file system. You will get links which are uch easier on internet and memory on rendering them in your Obsidian notes.

You can customize the upload behaviour and transformation options for each content type and each folder in you vault.


## How it Works

![Action GIF](docs/assets/cloudinary.gif)


## Configuration
1. Disable Obsidian Safe Mode
2. Install the Plugin
    - Install from the Obsidian Community Plugins (Recommended)
        - Go to `Settings > Community Plugins > Browse`
        - Search for "Cloudinary" and install
    - Manual install
        - Clone this repo
        - Install dependencies with `yarn` or `npm`
        - `npm run build` will install the plugin in the chosen obsidian vault
3. Enable the Plugin
4. Configure the settings

## Unsigned Uploads to Cloudinary
This plugin uploads to Cloudinary are unsigned.  [You can read more about that here](https://cloudinary.com/documentation/upload_images#unsigned_upload).  A signed upload would require the use of an API key and secret, and I opted against asking for that in the plugin configuration, as a choice for security reasons.

## Transformations
Cloudinary allows for on-the-fly image transformations using their API.  To the end-user, this is accomplished by making a simple URL modification to the resulting URL that Cloudinary gives back when an upload completes.  You can [read more about Cloudinary's transformation parameters here](https://cloudinary.com/documentation/transformation_reference).
As of version 0.2.0, you can now set a default transformation to be applied to all of your uploads with a comma-delimited list.  **Be mindful of syntax**, as using the incorrect transformation parameters will cause your images to not render in Obsidian.  

If this were to happen, this can be fixed by simply modifying the URL following the upload. 

**Be Mindful of your [transformation token allotment](https://cloudinary.com/blog/understanding_cloudinary_s_transformation_quotas)**.  Depending on your plan, Cloudinary allows for an 'x' number of transformations to take place per month.  Keep this count in mind as you apply transformations to your uploads

## Thanks
Special thanks to:
1. @jordanhandy for their [repo here](https://github.com/jordanhandy/obsidian-cloudinary-uploader).  I forked this repo and made some changes to it, but the base of this plugin is from their work.