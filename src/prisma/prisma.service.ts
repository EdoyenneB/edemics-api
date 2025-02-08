import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect(); // Connect to the database when the module initializes
  }

  async onModuleDestroy() {
    await this.$disconnect(); // Disconnect gracefully on shutdown
  }
}
