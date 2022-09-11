import { ZodError as RawZodError } from 'zod'
import { AppError } from './AppError'

export class ZodError extends AppError {
  ctx: RawZodError

  constructor(message: string, zodError: RawZodError) {
    super(message)
    this.name = 'ZodError'
    this.ctx = zodError
  }
}

export type ZodErrorParams = ConstructorParameters<typeof ZodError>
