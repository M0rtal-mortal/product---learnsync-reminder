import bcrypt from 'bcryptjs';
import { z } from 'zod';

// In-memory storage for users
const users: any[] = [];

// Use Zod-inferred type for repository inputs
type CreateUserInput = {
  email: string;
  password: string;
  name: string;
};

export class UserRepository {
  async create(userData: CreateUserInput) {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = {
      id: Date.now().toString(),
      ...userData,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(user);
    return user;
  }

  async findByEmail(email: string) {
    const user = users.find(u => u.email === email);
    return user;
  }

  async findAll() {
    return users;
  }

  async verifyPassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
export const userRepository = new UserRepository();
