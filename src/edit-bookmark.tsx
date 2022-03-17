import { v4 as uuidv4 } from 'uuid'
import {
  Action,
  ActionPanel,
  Form,
  Icon,
  showToast,
  Toast,
  useNavigation,
} from '@raycast/api'
import { Bookmark, db, InProgressBookmark } from './db'

export const EditBookmark: React.FC<
  Bookmark & { refreshBookmarks: () => void }
> = ({ id, url, title, keywords, refreshBookmarks }) => {
  return (
    <Form
      actions={
        <ActionPanel>
          <Submit id={id} refreshBookmarks={refreshBookmarks} />
        </ActionPanel>
      }
    >
      <Form.TextField
        defaultValue={url}
        id="url"
        title="url"
        placeholder="http://poop.bike"
      />
      <Form.TextField
        defaultValue={title}
        id="title"
        title="title"
        placeholder="Pretty Title"
      />
      <Form.TextField
        defaultValue={keywords}
        id="keywords"
        title="keywords"
        placeholder="searchable words or characters separated by spaces"
      />
    </Form>
  )
}

export const Submit: React.FC<
  Pick<Bookmark, 'id'> & { refreshBookmarks: () => void }
> = ({ id, refreshBookmarks }) => {
  const { pop } = useNavigation()

  const handleSubmit = async ({ url, title, keywords }: Bookmark) => {
    if (!url) {
      showToast({
        style: Toast.Style.Failure,
        title: 'url is required',
      })
      return null
    }
    db.read()
    const existingBookmarkIndex = db.data.bookmarks.findIndex(
      (x) => x.id === id,
    )

    if (existingBookmarkIndex !== -1) {
      db.data.bookmarks[existingBookmarkIndex] = {
        id,
        url,
        title,
        keywords,
      }
      db.write()
    }

    showToast({
      style: Toast.Style.Success,
      title: `Edited bookmark for ${title}`,
    })

    refreshBookmarks()
    pop()
  }

  return (
    <Action.SubmitForm
      icon={Icon.Checkmark}
      title="Save Bookmark"
      onSubmit={handleSubmit}
    />
  )
}

export default EditBookmark
