-- CampusSync: Add courses, exams, milestones, meetings, rsvps, notifications tables

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add profile fields to Users
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "university" TEXT DEFAULT '';
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "major" TEXT DEFAULT '';
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "grade" TEXT DEFAULT '';

-- Courses
CREATE TABLE IF NOT EXISTS "Courses" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "teacher" TEXT DEFAULT '',
  "location" TEXT DEFAULT '',
  "day_of_week" INTEGER NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "color" TEXT DEFAULT 'primary',
  "is_imported" BOOLEAN DEFAULT FALSE,
  "semester" TEXT DEFAULT '2026春季',
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Exams
CREATE TABLE IF NOT EXISTS "Exams" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "exam_type" TEXT NOT NULL,
  "exam_date" TEXT NOT NULL,
  "registration_deadline" TEXT DEFAULT '',
  "location" TEXT DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'upcoming',
  "prep_progress" INTEGER DEFAULT 0,
  "reminder_days_before" INTEGER DEFAULT 7,
  "notes" TEXT DEFAULT '',
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Exam Milestones
CREATE TABLE IF NOT EXISTS "ExamMilestones" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "exam_id" TEXT NOT NULL REFERENCES "Exams"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "due_date" TEXT DEFAULT '',
  "completed" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Meetings
CREATE TABLE IF NOT EXISTS "Meetings" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'class',
  "meeting_date" TEXT NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT DEFAULT '',
  "location" TEXT DEFAULT '',
  "participants" TEXT DEFAULT '',
  "description" TEXT DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'active',
  "share_link" TEXT DEFAULT '',
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Meeting RSVPs
CREATE TABLE IF NOT EXISTS "MeetingRsvps" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "meeting_id" TEXT NOT NULL REFERENCES "Meetings"("id") ON DELETE CASCADE,
  "participant_email" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS "Notifications" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "is_read" BOOLEAN DEFAULT FALSE,
  "action_url" TEXT DEFAULT '',
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Notification Settings
CREATE TABLE IF NOT EXISTS "NotificationSettings" (
  "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL UNIQUE REFERENCES "Users"("id") ON DELETE CASCADE,
  "quiet_hours_enabled" BOOLEAN DEFAULT TRUE,
  "quiet_start" TEXT DEFAULT '23:00',
  "quiet_end" TEXT DEFAULT '07:00',
  "in_app_enabled" BOOLEAN DEFAULT TRUE,
  "email_enabled" BOOLEAN DEFAULT TRUE,
  "push_enabled" BOOLEAN DEFAULT TRUE,
  "exam_reminder_days" INTEGER DEFAULT 7,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);
