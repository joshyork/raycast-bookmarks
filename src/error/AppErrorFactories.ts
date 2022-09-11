import { ZodError as RawZodError } from 'zod'
import { AppError, AppErrorParams } from './AppError'
import { ZodError, ZodErrorParams } from './ZodError'

export const appErrorF = (...args: AppErrorParams) => new AppError(...args)
export const appErrorFThunk =
  (...args: AppErrorParams) =>
  () =>
    appErrorF(...args)

export const zodErrorF = (...args: ZodErrorParams) => new ZodError(...args)
export const zodErrorFThunk = (message: string) => (error: RawZodError) =>
  zodErrorF(message, error)
