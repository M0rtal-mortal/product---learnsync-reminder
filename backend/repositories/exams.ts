import { db } from '../db';
import {
  exams, InsertExam, insertExamSchema,
  examMilestones, InsertExamMilestone, insertExamMilestoneSchema,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

type CreateExamInput = z.infer<typeof insertExamSchema>;
type CreateMilestoneInput = z.infer<typeof insertExamMilestoneSchema>;

export class ExamRepository {
  async findByUserId(userId: string) {
    return db.select().from(exams).where(eq(exams.userId, userId));
  }

  async findById(id: string) {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async create(data: CreateExamInput) {
    const [exam] = await db.insert(exams).values(data as InsertExam).returning();
    return exam;
  }

  async update(id: string, userId: string, data: Partial<CreateExamInput>) {
    const [exam] = await db
      .update(exams)
      .set({ ...data, updatedAt: new Date() } as Partial<InsertExam>)
      .where(and(eq(exams.id, id), eq(exams.userId, userId)))
      .returning();
    return exam;
  }

  async delete(id: string, userId: string) {
    const result = await db
      .delete(exams)
      .where(and(eq(exams.id, id), eq(exams.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Milestones
  async getMilestones(examId: string) {
    return db.select().from(examMilestones).where(eq(examMilestones.examId, examId));
  }

  async createMilestone(data: CreateMilestoneInput) {
    const [milestone] = await db.insert(examMilestones).values(data as InsertExamMilestone).returning();
    return milestone;
  }

  async updateMilestone(id: string, data: Partial<CreateMilestoneInput>) {
    const [milestone] = await db
      .update(examMilestones)
      .set(data as Partial<InsertExamMilestone>)
      .where(eq(examMilestones.id, id))
      .returning();
    return milestone;
  }

  async deleteMilestone(id: string) {
    const result = await db.delete(examMilestones).where(eq(examMilestones.id, id)).returning();
    return result.length > 0;
  }
}

export const examRepository = new ExamRepository();
