import fs from 'fs-extra'
import path from 'path'
import { environment, LocalStorage } from '@raycast/api'
import { LowSync, JSONFileSync } from 'lowdb'
import { getPreferenceValues } from './utils'
import { Octokit } from 'octokit'
import { Endpoints } from '@octokit/types'
import { pipe, S, flow, R } from '@typedash/typedash'
import * as T from 'fp-ts/Task'
import * as TO from 'fp-ts/TaskOption'
import { z } from 'zod'

type GistResponse = Omit<Endpoints['POST /gists']['response'], 'status'>

const Bookmark = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  keywords: z.string(),
})
export type Bookmark = z.infer<typeof Bookmark>

const GistContent = z.object({
  bookmarks: z.array(Bookmark),
})

export type InProgressBookmark = Partial<Bookmark>

export type Database = {
  bookmarks: Array<Bookmark>
}
const seed = { bookmarks: [] }

const filepath = path.join(environment.supportPath, 'db.json')

fs.ensureFileSync(filepath)

if (fs.statSync(filepath).size === 0) {
  fs.writeJSONSync(filepath, seed)
}

const adapter = new JSONFileSync<Database>(filepath)
const db_ = new LowSync(adapter)
db_.read()
db_.data = db_.data || seed
db_.write()

export const db = Object.assign(db_, { data: db_.data as Database })

export const octokit = new Octokit({
  auth: getPreferenceValues().gh_access_token,
})

const FILENAME = 'raycast-bookmarks.json'
const GIST_ID_STORAGE_KEY = 'gh_gist_id'

const getBookmarksFromGistResponse = (x: TO.TaskOption<GistResponse>) =>
  pipe(
    x,
    TO.map((x) => x.data.files),
    TO.chain(TO.fromNullable),
    TO.map((x) => {
      console.log('files?', x)
      return x
    }),
    TO.map(R.prop(FILENAME)),
    TO.chain(TO.fromNullable),
    TO.map(R.prop('content')),
    TO.chain(TO.fromNullable),
    TO.map(JSON.parse),
    TO.map(GistContent.parse),
    TO.map(R.prop('bookmarks')),
  )

export const getBookmarks = () =>
  pipe(
    () => LocalStorage.getItem(GIST_ID_STORAGE_KEY),
    TO.fromTask,
    TO.chain(TO.fromPredicate(S.isString)),
    TO.chain((gist_id) =>
      TO.fromTask(() => octokit.rest.gists.get({ gist_id })),
    ),
    getBookmarksFromGistResponse,
    TO.getOrElseW(() =>
      pipe(
        () =>
          octokit.rest.gists.create({
            description: 'Raycast Bookmarks',
            files: {
              [FILENAME]: {
                content: JSON.stringify({
                  bookmarks: [],
                }),
              },
            },
          }),
        T.map((x) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          LocalStorage.setItem(GIST_ID_STORAGE_KEY, x.data.id!)
          return x
        }),
        TO.fromTask,
        getBookmarksFromGistResponse,
        TO.getOrElseW(() => () => {
          console.log('failed')
          return Promise.resolve([] as Array<Bookmark>)
        }),
      ),
    ),
  )
