import {
  Action,
  ActionPanel,
  Icon,
  List,
  Toast,
  showToast,
  useNavigation,
} from '@raycast/api'
import { R, pipe, tap } from '@typedash/typedash'
import * as TE from 'fp-ts/TaskEither'
import fuzzysort from 'fuzzysort'
import React from 'react'
import { deleteBookmark, getAndCacheBookmarks, getCachedBookmarks } from './db'
import EditBookmark from './edit-bookmark'
import { Bookmark } from './types'

const SearchBookmarks = () => {
  const [allBookmarks, setAllBookmarks] = React.useState<Array<Bookmark>>([])
  const [searchText, setSearchText] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<Array<Bookmark>>([])

  React.useEffect(() => {
    const getInitialBookmarks = () =>
      pipe(
        getCachedBookmarks(),
        TE.map((bookmarks) => {
          setAllBookmarks(bookmarks)
          setSearchResults(bookmarks)
        }),
      )()
    const getHydratedBookmarks = () =>
      pipe(
        getAndCacheBookmarks(),
        TE.map((bookmarks) => {
          setAllBookmarks(bookmarks)
          setSearchResults(bookmarks)
        }),
      )()

    getInitialBookmarks()
    getHydratedBookmarks()
  }, [])

  React.useEffect(() => {
    if (!searchText) {
      setSearchResults(allBookmarks)
      return
    }

    pipe(
      fuzzysort.go(searchText, allBookmarks, {
        keys: ['keywords', 'title', 'url'],
      }),
      // types aren't happy with A.map
      (x) => x.map(R.prop('obj')),
      setSearchResults,
    )
  }, [searchText, allBookmarks])

  return (
    <List onSearchTextChange={setSearchText}>
      {searchResults.length === 0
        ? null
        : searchResults.map((bookmark, i) => {
            const { title, url } = bookmark
            return (
              <List.Item
                key={i}
                icon={{
                  source: `https://www.google.com/s2/favicons?domain=${url}`,
                  fallback: 'white_globe.png',
                }}
                title={title}
                subtitle={url}
                actions={
                  <ActionPanel>
                    <OpenUrl bookmark={bookmark} />
                    <EditItem
                      bookmark={bookmark}
                      setAllBookmarks={setAllBookmarks}
                    />
                    <DeleteBookmark
                      bookmark={bookmark}
                      setAllBookmarks={setAllBookmarks}
                    />
                    <Action.CopyToClipboard
                      title="Copy URL to clipboard"
                      content={bookmark.url}
                      shortcut={{ modifiers: ['cmd'], key: '.' }}
                    />
                  </ActionPanel>
                }
              />
            )
          })}
    </List>
  )
}

const OpenUrl: React.FC<{ bookmark: Bookmark }> = ({ bookmark }) => {
  const { pop } = useNavigation()

  return (
    <Action.OpenInBrowser
      url={bookmark.url}
      icon={Icon.Globe}
      title="Open in Browser"
      onOpen={() => pop()}
    />
  )
}

const EditItem: React.FC<{
  bookmark: Bookmark
  setAllBookmarks: (bookmarks: Array<Bookmark>) => void
}> = ({ bookmark, setAllBookmarks }) => {
  return (
    <Action.Push
      title="Edit Bookmark"
      target={
        <EditBookmark bookmark={bookmark} setAllBookmarks={setAllBookmarks} />
      }
    />
  )
}

const DeleteBookmark: React.FC<{
  bookmark: Bookmark
  setAllBookmarks: (bookmarks: Array<Bookmark>) => void
}> = ({ bookmark, setAllBookmarks }) => {
  return (
    <Action
      title="Delete Bookmark"
      style={Action.Style.Destructive}
      onAction={async () => {
        const toast = await showToast({
          style: Toast.Style.Animated,
          title: `Deleting bookmark ${bookmark.title}`,
        })

        await pipe(
          deleteBookmark(bookmark),
          TE.map(tap(setAllBookmarks)),
          TE.map(() => {
            toast.style = Toast.Style.Success
            toast.title = `Deleted bookmark ${bookmark.title}`
          }),
        )()
      }}
    />
  )
}

export default SearchBookmarks
