---
label: Upload single note assets to Cloudinary
layout: default
order: 900
author: Jordan Handy
icon: cloud
---
## Upload Single Note Assets to Cloudinary

Within the command palette, run the "Upload files in current note to Cloudinary" option.  This will take all local assets located in the current note and attempt to upload them to Cloudinary.

!!!warning
It is **strongly** recommended to take a backup of your notes before you perform this action.
As part of the action, your local media assets are **not deleted** when the upload to Cloudinary happens, so you can still reference them if you wanted to.  However, because of the nature of the upload, and the variability of syntax in how some users may choose to reference media, this may alter the formatting of your notes.  Use with caution.
!!!

The success / failure of this plugin largely depends on the following factors:
1. Your Cloudinary plan -- Certain Cloudinary plans have quotas applied to their accounts.  Consult Cloudinary documentation to understand what your limits are
2. The file types being uploaded -- Cloudinary only accepts certain file types to be uploaded to their servers.  If you try to upload an unsupported file type, the upload for that specific file will fail.  Consult [this documentation on media types](https://support.cloudinary.com/hc/en-us/articles/202520642-What-type-of-image-video-and-audio-formats-do-you-support) and [this documentation on raw types](https://support.cloudinary.com/hc/en-us/articles/202520572-Using-Cloudinary-for-files-other-than-images-and-videos) for more information.

## Warning
When you first use the option for mass note upload, you will be presented with a warning message explaining the potential dangers of your action.  By default, this warning message will be displayed **every time** you invoke the action.  If you would like to disable this message, toggle the "Hide command palette mass upload warning" option in plugin settings.
## Demo
View a demo of the command below:
![Demo video - mass upload](https://res.cloudinary.com/dakfccuv5/video/upload/v1718021709/mass-note-upload_qnx5ar.mp4)

Continue to [Configuring Cloudinary](configuring-cloudinary.md)