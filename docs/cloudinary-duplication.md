---
label: Cloudinary Duplication
layout: default
order: 600
author: Jordan Handy
icon: gear
---
## Duplication in Cloudinary
Without proper configuration, it is highly likely that Cloudinary will not upload items as you expect.  I recommend reading [Cloudinary documentation on Upload Presets](https://support.cloudinary.com/hc/en-us/articles/360016481620-What-are-Upload-presets-and-how-to-use-them).

This doc will explain some of the most important pieces of information.

### Use filename or externally-defined public ID
In your Upload Preset Settings under the Storage and Access menu, this option allows you to preserve filenames in Cloudinary.  Normally, when you upload an item to Cloudinary, it is renamed with a unique public ID.  If you would like to preserve filename, use this setting to allow for you to keep original filenames.  The Obsidian plugin is configured such that filenames will be used if this setting is enabled.
![Externally defined public ID](https://res.cloudinary.com/dakfccuv5/image/upload/v1718108147/457f3fb2-f4c6-4235-8708-981ed138485d.png)

## Unique Filename
If **disabled**, the Unique Filename option will guard against duplication.  With this enabled, Cloudinary will append random characters to end string of every upload.  This means that even if you preserve file names, no two uploads of the same file will match and every upload will be unique.  This could lead to mass duplication.

Keep this **disabled** so that if a file with the same filename already exists duplication is less-likely to occur 
![Unique Filename](https://res.cloudinary.com/dakfccuv5/image/upload/v1718108164/46971520-e89b-4ae3-ad31-83a7790419d3.png)


Continue to [Plugin Commands](plugin-commands.md)