import { db } from '../db';
import {
  meetings, InsertMeeting, insertMeetingSchema,
  meetingRsvps, InsertMeetingRsvp, insertMeetingRsvpSchema,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

type CreateMeetingInput = z.infer<typeof insertMeetingSchema>;
type CreateRsvpInput = z.infer<typeof insertMeetingRsvpSchema>;

export class MeetingRepository {
  async findByUserId(userId: string) {
    return db.select().from(meetings).where(eq(meetings.userId, userId));
  }

  async findById(id: string) {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async create(data: CreateMeetingInput) {
    const [meeting] = await db.insert(meetings).values(data as InsertMeeting).returning();
    return meeting;
  }

  async update(id: string, userId: string, data: Partial<CreateMeetingInput>) {
    const [meeting] = await db
      .update(meetings)
      .set({ ...data, updatedAt: new Date() } as Partial<InsertMeeting>)
      .where(and(eq(meetings.id, id), eq(meetings.userId, userId)))
      .returning();
    return meeting;
  }

  async delete(id: string, userId: string) {
    const result = await db
      .delete(meetings)
      .where(and(eq(meetings.id, id), eq(meetings.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // RSVPs
  async getRsvps(meetingId: string) {
    return db.select().from(meetingRsvps).where(eq(meetingRsvps.meetingId, meetingId));
  }

  async upsertRsvp(data: CreateRsvpInput) {
    const existing = await db
      .select()
      .from(meetingRsvps)
      .where(
        and(
          eq(meetingRsvps.meetingId, data.meetingId),
          eq(meetingRsvps.participantEmail, data.participantEmail)
        )
      );
    if (existing.length > 0) {
      const [rsvp] = await db
        .update(meetingRsvps)
        .set({ status: data.status } as Partial<InsertMeetingRsvp>)
        .where(eq(meetingRsvps.id, existing[0].id))
        .returning();
      return rsvp;
    }
    const [rsvp] = await db.insert(meetingRsvps).values(data as InsertMeetingRsvp).returning();
    return rsvp;
  }
}

export const meetingRepository = new MeetingRepository();
