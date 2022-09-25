import {
  Action,
  ActionPanel,
  Form,
  Icon,
  Toast,
  showToast,
  useNavigation,
} from '@raycast/api'
import { pipe, tap } from '@typedash/typedash'
import * as TE from 'fp-ts/TaskEither'
import React from 'react'
import { updateBookmark } from './db'
import { ZodError } from './error'
import { Bookmark, FormErrors, SubmittedBookmark } from './types'
import { TE_fromZodParse, formErrors_from_zodError } from './utils'

type setErrors = React.Dispatch<React.SetStateAction<FormErrors>>

export const EditBookmark: React.FC<{
  bookmark: Bookmark
  setAllBookmarks: (bookmarks: Array<Bookmark>) => void
}> = ({ bookmark, setAllBookmarks }) => {
  const [errors, setErrors] = React.useState<FormErrors>({})

  return (
    <Form
      navigationTitle="Edit Bookmark"
      actions={
        <ActionPanel>
          <Submit
            id={bookmark.id}
            setAllBookmarks={setAllBookmarks}
            setErrors={setErrors}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        defaultValue={bookmark.url}
        id="url"
        title="URL"
        placeholder="http://poop.bike"
        error={errors.url}
      />
      <Form.TextField
        defaultValue={bookmark.title}
        id="title"
        title="Title"
        placeholder="Pretty Title"
        error={errors.title}
      />
      <Form.TextField
        defaultValue={bookmark.keywords}
        id="keywords"
        title="Keywords"
        placeholder="searchable words or characters separated by spaces"
      />
    </Form>
  )
}

export const Submit: React.FC<{
  id: Bookmark['id']
  setAllBookmarks: (bookmarks: Array<Bookmark>) => void
  setErrors: setErrors
}> = ({ id, setAllBookmarks, setErrors }) => {
  const { pop } = useNavigation()

  const handleSubmit = async (bookmark: SubmittedBookmark) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Updating bookmark: ${bookmark.title}`,
    })

    await pipe(
      TE.Do,
      TE.bind('bookmark', () =>
        pipe({ ...bookmark, id }, TE_fromZodParse(Bookmark)),
      ),
      TE.bindW('bookmarks', ({ bookmark }) => pipe(bookmark, updateBookmark)),
      TE.map(tap(({ bookmarks }) => setAllBookmarks(bookmarks))),
      TE.map(
        tap(({ bookmark }) => {
          toast.style = Toast.Style.Success
          toast.title = `Updated bookmark: ${bookmark.title}`
        }),
      ),
      TE.match((error) => {
        toast.style = Toast.Style.Failure
        toast.title = `Bookmark update failed`

        if (error instanceof ZodError) {
          pipe(error, formErrors_from_zodError, setErrors)
        }
      }, pop),
    )()
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
