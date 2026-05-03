import 'dotenv/config';

function parsePort(value: string | undefined, fallback: number) {
  const port = Number(value ?? fallback);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`REDIS_PORT must be a positive integer. Received '${value ?? fallback}'.`);
  }

  return port;
}

export const workerConfig = {
  redisHost: process.env.REDIS_HOST ?? 'localhost',
  redisPort: parsePort(process.env.REDIS_PORT, 6379),
};
