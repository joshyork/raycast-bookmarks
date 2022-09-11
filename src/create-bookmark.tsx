import {
  Action,
  ActionPanel,
  Clipboard,
  Form,
  Icon,
  Toast,
  showToast,
  useNavigation,
} from '@raycast/api'
import { O, pipe, tap } from '@typedash/typedash'
import * as TE from 'fp-ts/TaskEither'
import React from 'react'
import { z } from 'zod'
import { createBookmark } from './db'
import { FormErrors, SubmittedBookmark } from './types'
import { TE_fromZodParse } from './utils'
import { formErrors_from_zodError } from './utils/formErrors_from_ZodError'

type setErrors = React.Dispatch<React.SetStateAction<FormErrors>>

const CreateBookmark = () => {
  const [url, setUrl] = React.useState<string>()
  const [errors, setErrors] = React.useState<FormErrors>({})

  React.useEffect(() => {
    Clipboard.readText().then((text) =>
      pipe(
        text,
        O.fromPredicate((x) =>
          pipe(x, z.string().url().safeParse, (result) => result.success),
        ),
        O.map(setUrl),
      ),
    )
  }, [])

  return (
    <Form
      actions={
        <ActionPanel>
          <Submit setErrors={setErrors} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Title"
        placeholder="Pretty Title"
        error={errors.title}
      />
      <Form.TextField
        id="url"
        title="URL"
        placeholder="http://poop.bike"
        value={url}
        onChange={setUrl}
        error={errors.url}
      />
      <Form.TextField
        id="keywords"
        title="Keywords"
        placeholder="searchable words or characters separated by spaces"
      />
    </Form>
  )
}

export const Submit: React.FC<{ setErrors: setErrors }> = ({ setErrors }) => {
  const { pop } = useNavigation()

  const handleSubmit = async (bookmark: Partial<SubmittedBookmark>) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Creating bookmark: ${bookmark.title}`,
    })

    await pipe(
      TE.Do,
      TE.bind('bookmark', () =>
        pipe(bookmark, TE_fromZodParse(SubmittedBookmark)),
      ),
      TE.bindW('bookmarks', ({ bookmark }) =>
        pipe(bookmark, createBookmark, TE.rightTask),
      ),
      TE.map(
        tap(({ bookmark }) => {
          toast.style = Toast.Style.Success
          toast.title = `Created bookmark: ${bookmark.title}`
        }),
      ),
      TE.match((error) => {
        toast.style = Toast.Style.Failure
        toast.title = `Bookmark creation failed`

        pipe(error, formErrors_from_zodError, setErrors)
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

export default CreateBookmark
