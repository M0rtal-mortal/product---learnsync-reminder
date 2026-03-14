import { db } from '../db';
import { courses, InsertCourse, insertCourseSchema } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

type CreateCourseInput = z.infer<typeof insertCourseSchema>;

export class CourseRepository {
  async findByUserId(userId: string) {
    return db.select().from(courses).where(eq(courses.userId, userId));
  }

  async findById(id: string) {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async create(data: CreateCourseInput) {
    const [course] = await db.insert(courses).values(data as InsertCourse).returning();
    return course;
  }

  async update(id: string, userId: string, data: Partial<CreateCourseInput>) {
    const [course] = await db
      .update(courses)
      .set({ ...data, updatedAt: new Date() } as Partial<InsertCourse>)
      .where(and(eq(courses.id, id), eq(courses.userId, userId)))
      .returning();
    return course;
  }

  async delete(id: string, userId: string) {
    const result = await db
      .delete(courses)
      .where(and(eq(courses.id, id), eq(courses.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async deleteByUserId(userId: string) {
    return db.delete(courses).where(eq(courses.userId, userId));
  }
}

export const courseRepository = new CourseRepository();
