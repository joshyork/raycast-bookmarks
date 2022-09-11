import { Endpoints } from '@octokit/types'
import { LocalStorage } from '@raycast/api'
import { A, R, S, pipe } from '@typedash/typedash'
import * as T from 'fp-ts/Task'
import * as TO from 'fp-ts/TaskOption'
import { Octokit } from 'octokit'
import { v4 } from 'uuid'
import { z } from 'zod'
import { Bookmark } from './types'
import { getPreferenceValues, serializeGistData } from './utils'

type GistResponse = Omit<Endpoints['POST /gists']['response'], 'status'>

const GistContent = z.object({
  bookmarks: z.array(Bookmark),
})

export const octokit = new Octokit({
  auth: getPreferenceValues().gh_access_token,
})

export const FILENAME = 'raycast-bookmarks.json'
export const GIST_ID_STORAGE_KEY = 'gh_gist_id'

const getBookmarksFromGistResponse = (x: TO.TaskOption<GistResponse>) =>
  pipe(
    x,
    TO.map((x) => x.data.files),
    TO.chain(TO.fromNullable),
    TO.map(R.prop(FILENAME)),
    TO.chain(TO.fromNullable),
    TO.map(R.prop('content')),
    TO.chain(TO.fromNullable),
    TO.map(JSON.parse),
    TO.map(GistContent.parse),
    TO.map(R.prop('bookmarks')),
  )

const getOrEmptyBookmarks = TO.getOrElseW(
  () => () => Promise.resolve([] as Array<Bookmark>),
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
                content: serializeGistData({ bookmarks: [] }),
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
        getOrEmptyBookmarks,
      ),
    ),
  )

export const createBookmark = (bookmark: Omit<Bookmark, 'id'>) =>
  pipe(
    T.Do,
    T.bind(
      'newBookmark',
      () => () => Promise.resolve({ ...bookmark, id: v4() }),
    ),
    T.bind('bookmarks', ({ newBookmark }) =>
      pipe(getBookmarks(), T.map(A.concat([newBookmark]))),
    ),
    T.bind('gistId', () =>
      pipe(
        () => LocalStorage.getItem(GIST_ID_STORAGE_KEY),
        T.map(z.string().parse),
      ),
    ),
    T.chain(
      ({ gistId, bookmarks, newBookmark }) =>
        () =>
          octokit.request('PATCH /gists/{gist_id}', {
            gist_id: gistId,
            description: `Created bookmark ${newBookmark.title} (${newBookmark.id})`,
            files: {
              [FILENAME]: {
                content: serializeGistData({ bookmarks }),
              },
            },
          }),
    ),
    TO.fromTask,
    getBookmarksFromGistResponse,
    getOrEmptyBookmarks,
  )

export const updateBookmark = (bookmark: Bookmark) =>
  pipe(
    T.Do,
    T.bind('bookmarks', () =>
      pipe(
        getBookmarks(),
        T.map(
          A.map((mark) => {
            if (mark.id === bookmark.id) {
              return bookmark
            }

            return mark
          }),
        ),
      ),
    ),
    T.bind('gistId', () =>
      pipe(
        () => LocalStorage.getItem(GIST_ID_STORAGE_KEY),
        T.map(z.string().parse),
      ),
    ),
    T.chain(
      ({ gistId, bookmarks }) =>
        () =>
          octokit.request('PATCH /gists/{gist_id}', {
            gist_id: gistId,
            description: `Updated bookmark ${bookmark.title} (${bookmark.id})`,
            files: {
              [FILENAME]: {
                content: serializeGistData({ bookmarks }),
              },
            },
          }),
    ),
    TO.fromTask,
    getBookmarksFromGistResponse,
    getOrEmptyBookmarks,
  )

export const deleteBookmark = (bookmark: Bookmark) =>
  pipe(
    T.Do,
    T.bind('bookmarks', () =>
      pipe(getBookmarks(), T.map(A.reject(R.whereEq({ id: bookmark.id })))),
    ),
    T.bind('gistId', () =>
      pipe(
        () => LocalStorage.getItem(GIST_ID_STORAGE_KEY),
        T.map(z.string().parse),
      ),
    ),
    T.chain(
      ({ gistId, bookmarks }) =>
        () =>
          octokit.request('PATCH /gists/{gist_id}', {
            gist_id: gistId,
            description: `Deleted bookmark ${bookmark.title} (${bookmark.id})`,
            files: {
              [FILENAME]: {
                content: serializeGistData({ bookmarks }),
              },
            },
          }),
    ),
    TO.fromTask,
    getBookmarksFromGistResponse,
    getOrEmptyBookmarks,
  )
