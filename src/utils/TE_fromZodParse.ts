import { pipe } from '@typedash/typedash'
import * as TE from 'fp-ts/TaskEither'
import { ParseParams, ZodTypeAny } from 'zod'
import { ZodError, zodErrorFThunk } from '../error'
import { E_fromSafeParseResult } from './E_fromSafeParseResult'

export const TE_fromZodParse =
  <T extends ZodTypeAny>(schema: T, safeParams?: Partial<ParseParams>) =>
  (data: unknown): TE.TaskEither<ZodError, T['_output']> =>
    pipe(
      schema.safeParse(data, safeParams),
      E_fromSafeParseResult,
      TE.fromEither,
      TE.mapLeft(zodErrorFThunk('Zod parse error')),
    )
