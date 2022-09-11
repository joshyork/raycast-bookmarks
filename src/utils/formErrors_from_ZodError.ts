import { A, R, pipe } from '@typedash/typedash'
import { ZodError } from '../error'

export const formErrors_from_zodError = (error: ZodError) =>
  pipe(
    error,
    R.prop('ctx'),
    R.prop('issues'),
    A.reduce({}, (acc, issue) => {
      return {
        ...acc,
        [issue.path[0]]: issue.message,
      }
    }),
  )
