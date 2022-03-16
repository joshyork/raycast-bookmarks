import fs from 'fs-extra'
import path from 'path'
import { environment } from '@raycast/api'
import { LowSync, JSONFileSync } from 'lowdb'

export type Bookmark = {
  url: string
  title: string
  keywords: string
}

export type InProgressBookmark = Partial<Bookmark>

export type Database = {
  bookmarks: Array<Bookmark>
}
const seed = { bookmarks: [] }

const filepath = path.join(environment.supportPath, 'db.json')

fs.ensureFileSync(filepath)
const adapter = new JSONFileSync<Database>(filepath)
const db_ = new LowSync(adapter)
db_.read()
db_.data = db_.data || seed
db_.write()

export const db = Object.assign(db_, { data: db_.data as Database })
