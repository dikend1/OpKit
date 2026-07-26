import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

  async findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  async create(email: string, password: string) {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    return this.db.user.create({
      data: { email, passwordHash },
    });
  }
}
