import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { Redis } from '@upstash/redis';

@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorage {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  async increment(
    key: string,
    ttl: number, // milliseconds (ThrottlerModule v6)
    limit: number,
    blockDuration: number, // milliseconds (ThrottlerModule v6)
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const blockKey = `${key}_block`;
    const ttlSec = Math.ceil(ttl / 1000);
    const blockSec = Math.ceil(blockDuration / 1000);

    // Check if this key is currently blocked
    const blockTtl = await this.redis.ttl(blockKey);
    if (blockTtl > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: blockTtl,
      };
    }

    // Atomic increment + get TTL via pipeline
    const pipeline = this.redis.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const [totalHitsRaw, currentTtlRaw] = await pipeline.exec();
    const totalHits =
      typeof totalHitsRaw === 'number'
        ? totalHitsRaw
        : Number(totalHitsRaw ?? 0);
    const currentTtl =
      typeof currentTtlRaw === 'number'
        ? currentTtlRaw
        : Number(currentTtlRaw ?? 0);

    // Set expiry window on first hit
    if (totalHits === 1) {
      await this.redis.expire(key, ttlSec);
    }

    const timeToExpire = currentTtl > 0 ? currentTtl : ttlSec;
    const isBlocked = totalHits > limit;
    let timeToBlockExpire = 0;

    // Set block key only on the hit that first exceeds the limit
    if (isBlocked && blockSec > 0 && totalHits === limit + 1) {
      await this.redis.set(blockKey, 1, { ex: blockSec });
      timeToBlockExpire = blockSec;
    }

    return { totalHits, timeToExpire, isBlocked, timeToBlockExpire };
  }
}
