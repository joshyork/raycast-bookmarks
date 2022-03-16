import { List, Detail } from '@raycast/api'
import { Bookmark, db } from './db'

const renderBookmarkDetail = ({ url, title, keywords }: Bookmark) => `
# ${url}
${title ? `## Title: ${title}` : ''}
${keywords ? `## Keywords: ${keywords}` : ''}
`

const SearchBookmarks = () => {
  db.read()
  const { bookmarks } = db.data
  return (
    <List isShowingDetail>
      {bookmarks.length === 0 ? (
        <Detail markdown="## No Bookmarks" />
      ) : (
        bookmarks.map((bookmark, i) => {
          const { title, url, keywords } = bookmark
          const keywords_ = keywords ? keywords.split(' ') : undefined
          return (
            <List.Item
              key={i}
              title={title}
              subtitle={url}
              keywords={keywords_}
              detail={
                <List.Item.Detail markdown={renderBookmarkDetail(bookmark)} />
              }
            />
          )
        })
      )}
    </List>
  )
}

export default SearchBookmarks
