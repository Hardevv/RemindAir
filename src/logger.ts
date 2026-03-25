import pino from 'pino'

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  },
})

// logger.info("Start");
// logger.warn({ userId: 123 }, "Cos podejrzanego");
// logger.error(new Error("Boom"), "Blad");
