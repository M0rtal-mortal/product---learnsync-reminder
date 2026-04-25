// ============================================
// Auth Types
// ============================================
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  university?: string;
  major?: string;
  grade?: string;
}

// ============================================
// Course Types
// ============================================
export interface Course {
  id: string;
  userId: string;
  name: string;
  teacher: string;
  location: string;
  dayOfWeek: number; // 0=Mon..6=Sun
  startTime: string;
  endTime: string;
  color: string;
  isImported: boolean;
  semester: string;
  createdAt: string;
  updatedAt: string;
  weekType?: 'single' | 'double'; // 单周或双周
}

export interface CreateCourseInput {
  name: string;
  teacher?: string;
  location?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  color?: string;
  semester?: string;
}

// ============================================
// Exam Types
// ============================================
export type ExamType = 'CET4' | 'CET6' | 'NCRE1' | 'NCRE2' | 'custom';
export type ExamStatus = 'upcoming' | 'registered' | 'completed';

export interface ExamMilestone {
  id: string;
  examId: string;
  title: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

export interface Exam {
  id: string;
  userId: string;
  name: string;
  examType: string;
  examDate: string;
  registrationDeadline: string;
  location: string;
  status: ExamStatus;
  prepProgress: number;
  reminderDaysBefore: number;
  notes: string;
  milestones: ExamMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamInput {
  name: string;
  examType: string;
  examDate: string;
  registrationDeadline?: string;
  location?: string;
  status?: ExamStatus;
  prepProgress?: number;
  reminderDaysBefore?: number;
  notes?: string;
}

// ============================================
// Meeting Types
// ============================================
export type MeetingCategory = 'class' | 'club' | 'study';
export type MeetingStatus = 'active' | 'cancelled';
export type RsvpStatus = 'pending' | 'confirmed' | 'declined';

export interface MeetingRsvp {
  id: string;
  meetingId: string;
  participantEmail: string;
  status: RsvpStatus;
  createdAt: string;
}

export interface Meeting {
  id: string;
  userId: string;
  title: string;
  category: MeetingCategory;
  meetingDate: string;
  startTime: string;
  endTime: string;
  location: string;
  participants: string;
  description: string;
  status: MeetingStatus;
  shareLink: string;
  rsvps: MeetingRsvp[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingInput {
  title: string;
  category: MeetingCategory;
  meetingDate: string;
  startTime: string;
  endTime?: string;
  location?: string;
  participants?: string;
  description?: string;
}

// ============================================
// Notification Types
// ============================================
export type NotificationType = 'exam_reminder' | 'conflict' | 'sync_success' | 'meeting_invite' | 'general';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string;
  createdAt: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  examReminderDays: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ============================================
// Schedule / Conflict Types
// ============================================
export interface ScheduleEvent {
  id: string;
  title: string;
  type: 'course' | 'exam' | 'meeting';
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
  color?: string;
}

export interface ConflictPair {
  event1: ScheduleEvent;
  event2: ScheduleEvent;
  dayOfWeek: number;
}

export type ViewType = 'dashboard' | 'schedule' | 'exams' | 'meetings' | 'notifications' | 'account';
