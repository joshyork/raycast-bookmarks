import {
  Action,
  ActionPanel,
  Icon,
  List,
  Toast,
  showToast,
  useNavigation,
} from '@raycast/api'
import { A, R, pipe, tap } from '@typedash/typedash'
import * as T from 'fp-ts/Task'
import Fuse from 'fuse.js'
import React from 'react'
import { deleteBookmark, getBookmarks } from './db'
import EditBookmark from './edit-bookmark'
import { Bookmark } from './types'

const SearchBookmarks = () => {
  const [allBookmarks, setAllBookmarks] = React.useState<Array<Bookmark>>([])
  const [searchText, setSearchText] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<Array<Bookmark>>([])

  const fetchBookmarks = () =>
    pipe(
      getBookmarks(),
      T.map((bookmarks) => {
        setAllBookmarks(bookmarks)
        setSearchResults(bookmarks)
      }),
    )()

  React.useEffect(() => {
    fetchBookmarks()
  }, [])

  React.useEffect(() => {
    if (!searchText) {
      setSearchResults(allBookmarks)
      return
    }

    const fuse = new Fuse(allBookmarks, {
      includeScore: true,
      useExtendedSearch: true,
      keys: [
        {
          name: 'keywords',
          weight: 8,
        },
        {
          name: 'title',
          weight: 4,
        },
        { name: 'url', weight: 1 },
      ],
    })

    pipe(searchText, fuse.search, A.map(R.prop('item')), setSearchResults)
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
          T.map(tap(setAllBookmarks)),
          T.map(() => {
            toast.style = Toast.Style.Success
            toast.title = `Deleted bookmark ${bookmark.title}`
          }),
        )()
      }}
    />
  )
}

export default SearchBookmarks
