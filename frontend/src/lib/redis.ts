import Redis, { RedisOptions } from 'ioredis'

/**
 * Represents a Redis session with access and refresh tokens.
 */
export type RedisSession = {
  access_token: string
  refresh_token: string
}

function getRedisConfiguration() {
  return {
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
  }
}

// Singleton Redis instance — reuse TCP connection thay vì tạo/đóng mỗi lần
let _redisInstance: Redis | null = null

export function createRedisInstance(config = getRedisConfiguration()) {
  if (_redisInstance && _redisInstance.status !== 'end' && _redisInstance.status !== 'close') {
    return _redisInstance
  }
  try {
    const options: RedisOptions = {
      host: config.host,
      lazyConnect: true,
      showFriendlyErrorStack: true,
      enableAutoPipelining: true,
      maxRetriesPerRequest: 0,
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null // Dừng retry, không throw để tránh uncaughtException
        }
        return Math.min(times * 200, 1000)
      },
    }

    if (config.port) options.port = config.port
    if (config.password) options.password = config.password

    const redis = new Redis(options)
    redis.on('error', (error: unknown) => {
      console.warn('[Redis] Error connecting', error)
    })

    _redisInstance = redis
    return redis
  } catch {
    throw new Error(`[Redis] Could not create a Redis instance`)
  }
}
