import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly publisher: RedisClientType;
  private readonly subscriber: RedisClientType;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    this.publisher = createClient({ url });
    this.subscriber = this.publisher.duplicate();

    this.publisher.on('error', (error: Error) => {
      this.logger.error(`Redis publisher error: ${error.message}`);
    });

    this.subscriber.on('error', (error: Error) => {
      this.logger.error(`Redis subscriber error: ${error.message}`);
    });
  }

  async onModuleInit() {
    await Promise.all([this.publisher.connect(), this.subscriber.connect()]);
  }

  async onModuleDestroy() {
    await Promise.allSettled([this.publisher.disconnect(), this.subscriber.disconnect()]);
  }

  async publish<T>(channel: string, payload: T) {
    await this.publisher.publish(channel, JSON.stringify(payload));
  }

  async subscribe<T>(channel: string, handler: (payload: T) => void | Promise<void>) {
    await this.subscriber.subscribe(channel, async (message: string) => {
      try {
        await handler(JSON.parse(message) as T);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to process Redis message from ${channel}: ${reason}`);
      }
    });
  }
}