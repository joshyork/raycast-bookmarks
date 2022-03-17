import React from 'react'
import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  useNavigation,
} from '@raycast/api'
import Fuse from 'fuse.js'
import { Bookmark, db } from './db'
import EditBookmark from './edit-bookmark'

const SearchBookmarks = () => {
  const [refreshCount, setRefreshCount] = React.useState(0)
  const [searchText, setSearchText] = React.useState('')
  const [filteredList, setFilteredList] = React.useState<Array<Bookmark>>([])

  const refreshBookmarks = () => setRefreshCount((state) => state + 1)

  React.useEffect(() => {
    db.read()
    setFilteredList(db.data.bookmarks)
  }, [])

  React.useEffect(() => {
    if (!searchText) {
      setFilteredList(db.data.bookmarks)
      return
    }

    db.read()
    const fuse = new Fuse(db.data.bookmarks, {
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
    setFilteredList(results.map((x) => x.item))
  }, [searchText, refreshCount])

  return (
    <List onSearchTextChange={setSearchText}>
      {filteredList.length === 0
        ? null
        : filteredList.map((bookmark, i) => {
            const { title, url, keywords } = bookmark
            return (
              <List.Item
                key={i}
                title={title}
                subtitle={`${keywords} | ${url}`}
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
