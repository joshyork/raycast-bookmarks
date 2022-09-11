import {
  Action,
  ActionPanel,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from '@raycast/api'
import { pipe } from '@typedash/typedash'
import * as T from 'fp-ts/Task'
import Fuse from 'fuse.js'
import React from 'react'
import { Bookmark, getBookmarks } from './db'
import EditBookmark from './edit-bookmark'

const SearchBookmarks = () => {
  const [allBookmarks, setAllBookmarks] = React.useState<Array<Bookmark>>([])
  const [refreshCount, setRefreshCount] = React.useState(0)
  const [searchText, setSearchText] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<Array<Bookmark>>([])

  const refreshBookmarks = () => setRefreshCount((state) => state + 1)

  React.useEffect(() => {
    pipe(
      getBookmarks(),
      T.map((bookmarks) => {
        setAllBookmarks(bookmarks)
        setSearchResults(bookmarks)
      }),
    )()
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
          weight: 10,
        },
        {
          name: 'title',
          weight: 2,
        },
        { name: 'url', weight: 0.5 },
      ],
    })
    const results = fuse.search(searchText)
    setSearchResults(results.map((x) => x.item))
  }, [searchText, refreshCount])

  return (
    <List onSearchTextChange={setSearchText}>
      {searchResults.length === 0
        ? null
        : searchResults.map((bookmark, i) => {
            const { title, url, keywords } = bookmark
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
                      refreshBookmarks={refreshBookmarks}
                    />
                    <DeleteBookmark bookmark={bookmark} />
                  </ActionPanel>
                }
              />
            )
          })}
    </List>
  )
}

type BookmarkAction = React.FC<{ bookmark: Bookmark }>

const OpenUrl: BookmarkAction = ({ bookmark }) => {
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

const DeleteBookmark: BookmarkAction = ({ bookmark }) => {
  return (
    <Action
      title="Delete Bookmark"
      onAction={() => {
        showToast({
          style: Toast.Style.Success,
          title: `Fake deleting bookmark ${bookmark.id} ${bookmark.title}`,
        })
      }}
    />
  )
}

const EditItem: React.FC<{
  bookmark: Bookmark
  refreshBookmarks: () => void
}> = ({ bookmark, refreshBookmarks }) => {
  return (
    <Action.Push
      title="Edit Bookmark"
      target={
        <EditBookmark {...bookmark} refreshBookmarks={refreshBookmarks} />
      }
    />
  )
}

export default SearchBookmarks
