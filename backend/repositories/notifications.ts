import { db } from '../db';
import {
  notifications, InsertNotification, insertNotificationSchema,
  notificationSettings, InsertNotificationSettings, insertNotificationSettingsSchema, updateNotificationSettingsSchema,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

type CreateNotificationInput = z.infer<typeof insertNotificationSchema>;
type UpdateSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;

export class NotificationRepository {
  async findByUserId(userId: string) {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
  }

  async create(data: CreateNotificationInput) {
    const [notification] = await db
      .insert(notifications)
      .values(data as InsertNotification)
      .returning();
    return notification;
  }

  async markRead(id: string, userId: string) {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return notification;
  }

  async markAllRead(userId: string) {
    return db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async delete(id: string, userId: string) {
    const result = await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Settings
  async getSettings(userId: string) {
    const [settings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
    return settings;
  }

  async upsertSettings(userId: string, data: UpdateSettingsInput) {
    const existing = await this.getSettings(userId);
    if (existing) {
      const [settings] = await db
        .update(notificationSettings)
        .set({ ...data, updatedAt: new Date() } as Partial<InsertNotificationSettings>)
        .where(eq(notificationSettings.userId, userId))
        .returning();
      return settings;
    }
    const [settings] = await db
      .insert(notificationSettings)
      .values({ userId, ...data } as InsertNotificationSettings)
      .returning();
    return settings;
  }
}

export const notificationRepository = new NotificationRepository();
