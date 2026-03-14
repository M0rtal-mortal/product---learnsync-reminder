import { pgTable, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================
// Users Table
// ============================================
export const users = pgTable('Users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  university: text('university').default(''),
  major: text('major').default(''),
  grade: text('grade').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export const updateUserSchema = insertUserSchema.partial();
export const loginUserSchema = insertUserSchema.pick({ email: true, password: true });
export const signupUserSchema = insertUserSchema
  .extend({ confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters') })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type SignupUserInput = z.infer<typeof signupUserSchema>;

// ============================================
// Uploads Table
// ============================================
export const uploads = pgTable('Uploads', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  s3Key: text('s3_key').notNull(),
  s3Url: text('s3_url').notNull(),
  uploadId: text('upload_id'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const insertUploadSchema = createInsertSchema(uploads, {
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  fileType: z.string().min(1, 'File type is required'),
  s3Key: z.string().min(1, 'S3 key is required'),
  s3Url: z.string().url('Invalid S3 URL'),
  uploadId: z.string().optional(),
  status: z.enum(['pending', 'uploading', 'completed', 'failed']).optional(),
});
export const updateUploadSchema = insertUploadSchema.partial();
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;

// ============================================
// Courses Table
// ============================================
export const courses = pgTable('Courses', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  teacher: text('teacher').default(''),
  location: text('location').default(''),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Mon, 1=Tue, ..., 6=Sun
  startTime: text('start_time').notNull(), // HH:MM
  endTime: text('end_time').notNull(),     // HH:MM
  color: text('color').default('primary'),
  isImported: boolean('is_imported').default(false),
  semester: text('semester').default('2026春季'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const insertCourseSchema = createInsertSchema(courses, {
  name: z.string().min(1, 'Course name is required'),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
});
export const updateCourseSchema = insertCourseSchema.partial();
export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

// ============================================
// Exams Table
// ============================================
export const exams = pgTable('Exams', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  examType: text('exam_type').notNull(), // CET4, CET6, NCRE1, NCRE2, custom
  examDate: text('exam_date').notNull(), // YYYY-MM-DD
  registrationDeadline: text('registration_deadline').default(''),
  location: text('location').default(''),
  status: text('status').notNull().default('upcoming'), // upcoming, registered, completed
  prepProgress: integer('prep_progress').default(0), // 0-100
  reminderDaysBefore: integer('reminder_days_before').default(7),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const insertExamSchema = createInsertSchema(exams, {
  name: z.string().min(1, 'Exam name is required'),
  examType: z.string().min(1, 'Exam type is required'),
  examDate: z.string().min(1, 'Exam date is required'),
  prepProgress: z.coerce.number().int().min(0).max(100).optional(),
  reminderDaysBefore: z.coerce.number().int().min(0).optional(),
});
export const updateExamSchema = insertExamSchema.partial();
export type Exam = typeof exams.$inferSelect;
export type InsertExam = typeof exams.$inferInsert;

// ============================================
// Exam Milestones Table
// ============================================
export const examMilestones = pgTable('ExamMilestones', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  examId: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  dueDate: text('due_date').default(''),
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const insertExamMilestoneSchema = createInsertSchema(examMilestones, {
  title: z.string().min(1, 'Milestone title is required'),
});
export const updateExamMilestoneSchema = insertExamMilestoneSchema.partial();
export type ExamMilestone = typeof examMilestones.$inferSelect;
export type InsertExamMilestone = typeof examMilestones.$inferInsert;

// ============================================
// Meetings Table
// ============================================
export const meetings = pgTable('Meetings', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category').notNull().default('class'), // class, club, study
  meetingDate: text('meeting_date').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(),
  endTime: text('end_time').default(''),
  location: text('location').default(''),
  participants: text('participants').default(''), // comma-separated emails
  description: text('description').default(''),
  status: text('status').notNull().default('active'), // active, cancelled
  shareLink: text('share_link').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const insertMeetingSchema = createInsertSchema(meetings, {
  title: z.string().min(1, 'Meeting title is required'),
  category: z.enum(['class', 'club', 'study']),
  meetingDate: z.string().min(1, 'Meeting date is required'),
  startTime: z.string().min(1, 'Start time is required'),
});
export const updateMeetingSchema = insertMeetingSchema.partial();
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

// ============================================
// Meeting RSVPs Table
// ============================================
export const meetingRsvps = pgTable('MeetingRsvps', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  meetingId: text('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
  participantEmail: text('participant_email').notNull(),
  status: text('status').notNull().default('pending'), // pending, confirmed, declined
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const insertMeetingRsvpSchema = createInsertSchema(meetingRsvps, {
  meetingId: z.string().min(1, 'Meeting ID is required'),
  participantEmail: z.string().email('Invalid email'),
  status: z.enum(['pending', 'confirmed', 'declined']).optional(),
});
export type MeetingRsvp = typeof meetingRsvps.$inferSelect;
export type InsertMeetingRsvp = typeof meetingRsvps.$inferInsert;

// ============================================
// Notifications Table
// ============================================
export const notifications = pgTable('Notifications', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // exam_reminder, conflict, sync_success, meeting_invite
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  actionUrl: text('action_url').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const insertNotificationSchema = createInsertSchema(notifications, {
  type: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================
// Notification Settings Table
// ============================================
export const notificationSettings = pgTable('NotificationSettings', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`).notNull(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  quietHoursEnabled: boolean('quiet_hours_enabled').default(true),
  quietStart: text('quiet_start').default('23:00'),
  quietEnd: text('quiet_end').default('07:00'),
  inAppEnabled: boolean('in_app_enabled').default(true),
  emailEnabled: boolean('email_enabled').default(true),
  pushEnabled: boolean('push_enabled').default(true),
  examReminderDays: integer('exam_reminder_days').default(7),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings);
export const updateNotificationSettingsSchema = insertNotificationSettingsSchema.partial();
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;
