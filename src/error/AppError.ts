export class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppError'
  }
}

export type AppErrorParams = ConstructorParameters<typeof AppError>
