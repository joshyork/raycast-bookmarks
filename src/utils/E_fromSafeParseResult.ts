import * as E from 'fp-ts/Either'
import { match } from 'ts-pattern'
import { ZodError } from 'zod'

export type SafeParseResult_Success<Output> = {
  success: true
  data: Output
}
export type SafeParseResult_Error<Input> = {
  success: false
  error: ZodError<Input>
}
export type SafeParseResult<Output, Input> =
  | SafeParseResult_Success<Output>
  | SafeParseResult_Error<Input>

export const E_fromSafeParseResult = <Output, Input>(
  safeParseResult: SafeParseResult<Output, Input>,
): E.Either<ZodError<Input>, Output> =>
  match(safeParseResult)
    .with({ success: true }, ({ data }) => E.right(data))
    .with({ success: false }, ({ error }) => E.left(error))
    .exhaustive()
