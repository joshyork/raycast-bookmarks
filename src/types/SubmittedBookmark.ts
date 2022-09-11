import { z } from 'zod'

export const SubmittedBookmark = z.object({
  url: z.string().min(1, { message: 'URL is required' }),
  title: z.string().min(1, { message: 'Title is required' }),
  keywords: z.string().optional().default(''),
})

export type SubmittedBookmark = z.infer<typeof SubmittedBookmark>
