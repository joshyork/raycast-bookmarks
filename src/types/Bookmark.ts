import { z } from 'zod'
import { SubmittedBookmark } from './SubmittedBookmark'

export const Bookmark = SubmittedBookmark.extend({
  id: z.string().min(1),
})

export type Bookmark = z.infer<typeof Bookmark>
