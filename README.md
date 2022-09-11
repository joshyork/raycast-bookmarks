# Raycast Bookmarks

Raycast Bookmarks, inspired by [Filemark](https://github.com/jackchuka/alfred-workflow-bookmarks).

## Install / Setup

- Clone repo
- "Import extension" command in raycast and pick the folder
- Set GitHub personal access token
- Use the search or create command to ensure a gist has been created for you
- Find newly created gist in GitHub and optionally seed any existing bookmarks

## Migration Script

If you're coming from [Filemark](https://github.com/jackchuka/alfred-workflow-bookmarks), you can use this script to migrate your existing bookmarks.

```sh
ts-node ./scripts/fromFilemark.ts
```
