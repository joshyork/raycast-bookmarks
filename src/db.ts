import { Endpoints } from '@octokit/types'
import { LocalStorage } from '@raycast/api'
import { A, R, S, TE, constTrue, pipe, tapLogTag } from '@typedash/typedash'
import { Octokit } from 'octokit'
import { P, match } from 'ts-pattern'
import { v4 } from 'uuid'
import { z } from 'zod'
import { AppError, appErrorF, appErrorFThunk } from './error'
import { Bookmark } from './types'
import {
  TE_fromZodParse,
  getPreferenceValues,
  serializeGistData,
} from './utils'

type GistResponse = Omit<Endpoints['POST /gists']['response'], 'status'>

const GistContent = z.object({
  bookmarks: z.array(Bookmark),
})

type GistContent = z.infer<typeof GistContent>

export const octokit = new Octokit({
  auth: getPreferenceValues().gh_access_token,
})

export const FILENAME = 'raycast-bookmarks.json'
export const GIST_ID_STORAGE_KEY = 'gh_gist_id'
export const BOOKMARKS_STORAGE_KEY = 'bookmarks-cache'

const getContentFromGistResponse = (x: GistResponse) =>
  pipe(
    x.data.files,
    TE.fromNullable(appErrorF('Gist files not found')),
    TE.map(R.prop(FILENAME)),
    TE.chain(
      TE.fromNullable(appErrorF(`${FILENAME} not found in gist response`)),
    ),
    TE.map(R.prop('content')),
    TE.chain(TE.fromNullable(appErrorF('Gist content is undefined'))),
    TE.map(JSON.parse),
    TE.chain(TE_fromZodParse(GistContent)),
  )

export const getCachedBookmarks = () =>
  pipe(
    () => LocalStorage.getItem(BOOKMARKS_STORAGE_KEY),
    TE.fromTask,
    TE.chain(
      TE.fromPredicate(
        S.isString,
        appErrorFThunk(`${BOOKMARKS_STORAGE_KEY} is not a string`),
      ),
    ),
    TE.map(JSON.parse),
    TE.map(GistContent.parse),
    TE.map(R.prop('bookmarks')),
  )

export const getAndCacheBookmarks = () =>
  pipe(
    // Attempt to setup gist id from preferences
    match(getPreferenceValues().gist_id)
      .with('', P.nullish, () => TE.right<AppError, boolean>(false))
      .with(P.string, (gist_id) =>
        pipe(
          gist_id,
          tapLogTag('gist_id in match'),
          TE.tryCatchK(
            (x) => LocalStorage.setItem(GIST_ID_STORAGE_KEY, x),
            appErrorFThunk('Failed to write gist id to storage'),
          ),
          TE.map(constTrue),
        ),
      )
      .exhaustive(),
    TE.chain(
      TE.tryCatchK(
        () => LocalStorage.getItem(GIST_ID_STORAGE_KEY),
        appErrorFThunk(`Failed to read gist id from storage`),
      ),
    ),
    TE.chain(
      TE.fromPredicate(
        S.isString,
        appErrorFThunk(`${GIST_ID_STORAGE_KEY} is not a string`),
      ),
    ),
    TE.chainW((gist_id) =>
      TE.fromTask(() => octokit.rest.gists.get({ gist_id })),
    ),
    TE.chain(getContentFromGistResponse),
    // TODO: create more error types and branch on instanceof to only create a
    // new gist when a gist id doesn't exist. This would prevent accidental
    // spamming on new gists while developing.
    TE.orElse(() =>
      pipe(
        TE.tryCatch(
          () =>
            octokit.rest.gists.create({
              description: 'Raycast Bookmarks',
              files: {
                [FILENAME]: {
                  content: serializeGistData({ bookmarks: [] }),
                },
              },
            }),
          appErrorFThunk('Failed to create gist'),
        ),
        TE.chainFirst((x) =>
          TE.tryCatch(
            () =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              LocalStorage.setItem(GIST_ID_STORAGE_KEY, x.data.id!),
            appErrorFThunk('Failed to write gist id to storage'),
          ),
        ),
        TE.chain(getContentFromGistResponse),
      ),
    ),
    TE.chainFirst((content) =>
      TE.tryCatch(
        () =>
          LocalStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(content)),
        appErrorFThunk('Failed to store bookmarks in cache'),
      ),
    ),
    TE.map(R.prop('bookmarks')),
  )

export const createBookmark = (bookmark: Omit<Bookmark, 'id'>) =>
  pipe(
    TE.Do,
    TE.bind('newBookmark', () => TE.of({ ...bookmark, id: v4() })),
    TE.bind('bookmarks', ({ newBookmark }) =>
      pipe(getAndCacheBookmarks(), (x) => x, TE.map(A.concat([newBookmark]))),
    ),
    TE.bind('gistId', () =>
      pipe(
        TE.tryCatch(
          () => LocalStorage.getItem(GIST_ID_STORAGE_KEY),
          appErrorFThunk(`Failed to read gist id`),
        ),
        TE.chain(TE_fromZodParse(z.string())),
      ),
    ),
    TE.chain(({ gistId, bookmarks, newBookmark }) =>
      TE.tryCatch(
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
        appErrorFThunk('Failed to create new bookmark'),
      ),
    ),
    TE.chain(getContentFromGistResponse),
    TE.map(R.prop('bookmarks')),
  )

export const updateBookmark = (bookmark: Bookmark) =>
  pipe(
    TE.Do,
    TE.bind('bookmarks', () =>
      pipe(
        getAndCacheBookmarks(),
        TE.map(
          A.map((mark) => {
            if (mark.id === bookmark.id) {
              return bookmark
            }

            return mark
          }),
        ),
      ),
    ),
    TE.bind('gistId', () =>
      pipe(
        TE.tryCatch(
          () => LocalStorage.getItem(GIST_ID_STORAGE_KEY),
          appErrorFThunk('Failed to read gist id'),
        ),
        TE.chain(TE_fromZodParse(z.string())),
      ),
    ),
    TE.chain(({ gistId, bookmarks }) =>
      TE.tryCatch(
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
        appErrorFThunk('Failed to update gist'),
      ),
    ),
    TE.chain(getContentFromGistResponse),
    TE.map(R.prop('bookmarks')),
  )

export const deleteBookmark = (bookmark: Bookmark) =>
  pipe(
    TE.Do,
    TE.bind('bookmarks', () =>
      pipe(
        getAndCacheBookmarks(),
        TE.map(A.reject(R.whereEq({ id: bookmark.id }))),
      ),
    ),
    TE.bind('gistId', () =>
      pipe(
        TE.tryCatch(
          () => LocalStorage.getItem(GIST_ID_STORAGE_KEY),
          appErrorFThunk('failed to read gist id'),
        ),
        TE.chain(TE_fromZodParse(z.string())),
      ),
    ),
    TE.chain(({ gistId, bookmarks }) =>
      TE.tryCatch(
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
        appErrorFThunk('Failed to remove bookmark'),
      ),
    ),
    TE.chain(getContentFromGistResponse),
    TE.map(R.prop('bookmarks')),
  )
