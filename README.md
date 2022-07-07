# Raycast Bookmarks

Raycast Bookmarks, inspired by [Filemark](https://github.com/jackchuka/alfred-workflow-bookmarks).

## Install / Setup

- Clone repo
- "Import extension" command in raycast and pick the folder
- Migrate your existing bookmarks text file to the json format the extension expects
- Optionally symlink that db.json file into somewhere that's synced

## Migration Script

If you're coming from File [Filemark](https://github.com/jackchuka/alfred-workflow-bookmarks), you can use this script to migrate your existing bookmarks.

```sh
ts-node ./scripts/fromFilemark.ts
```
