import React from 'react'
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
import { db, InProgressBookmark } from './db'

const CreateBookmark = () => {
  return (
    <Form
      actions={
        <ActionPanel>
          <Submit />
        </ActionPanel>
      }
    >
      <Form.TextField id="url" title="url" placeholder="http://poop.bike" />
      <Form.TextField id="title" title="title" placeholder="Pretty Title" />
      <Form.TextField
        id="keywords"
        title="keywords"
        placeholder="searchable words or characters separated by spaces"
      />
    </Form>
  )
}

export const Submit = () => {
  const { pop } = useNavigation()

  const handleSubmit = async ({ url, title, keywords }: InProgressBookmark) => {
    if (!url) {
      showToast({
        style: Toast.Style.Failure,
        title: 'url is required',
      })
      return null
    }
    db.read()
    db.data.bookmarks.push({
      id: uuidv4(),
      url,
      title: title || '',
      keywords: keywords || '',
    })
    db.write()

    showToast({
      style: Toast.Style.Success,
      title: `Added bookmark for ${url}`,
    })

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

export default CreateBookmark
