import { API_BASE_URL } from '@/config/constants';
import type {
  ApiResponse,
  Course, CreateCourseInput,
  Exam, CreateExamInput, ExamMilestone,
  Meeting, CreateMeetingInput, MeetingRsvp,
  Notification, NotificationSettings,
  AuthUser,
} from '@/types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async <T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    // 直接指定后端服务器地址
    const baseUrl = 'http://localhost:3001';
    const fullUrl = `${baseUrl}${path}`;
    
    // 获取认证token
    const token = localStorage.getItem('token');
    console.log('发送API请求:', fullUrl, 'Token:', token ? '存在' : '不存在');
    
    const res = await fetch(fullUrl, {
      ...options,
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {})
      },
    });
    
    console.log('响应状态:', res.status);
    
    // 先读取响应为文本
    const text = await res.text();
    console.log('响应内容:', text.substring(0, 200));
    
    // 尝试解析为JSON
    try {
      const data = JSON.parse(text);
      // 即使响应状态不是200，只要返回的是有效的JSON，就返回解析后的数据
      return data as ApiResponse<T>;
    } catch (jsonError) {
      // 如果JSON解析失败，抛出详细错误
      throw new Error(`服务器返回无效JSON: ${text.substring(0, 100)}...`);
    }
  } catch (error: any) {
    console.error('API请求错误:', error);
    throw new Error(error.message || '网络请求失败');
  }
};

// ============================================
// Auth
// ============================================
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  signup: (name: string, email: string, password: string, confirmPassword: string) =>
    request<{ token: string; user: AuthUser }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    }),
  me: () => request<{ user: AuthUser }>('/api/auth/me'),
  updateProfile: (data: { name?: string; password?: string; currentPassword?: string }) =>
    request<{ user: AuthUser }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============================================
// Courses
// ============================================
export const coursesApi = {
  getAll: () => request<Course[]>('/api/courses'),
  create: (data: CreateCourseInput) =>
    request<Course>('/api/courses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateCourseInput>) =>
    request<Course>(`/api/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<null>(`/api/courses/${id}`, { method: 'DELETE' }),
  import: (schoolData: { school: string; username: string; password: string }) =>
    request<Course[]>('/api/courses/import', { method: 'POST', body: JSON.stringify(schoolData) }),
};

// ============================================
// Exams
// ============================================
export const examsApi = {
  getAll: () => request<Exam[]>('/api/exams'),
  create: (data: CreateExamInput) =>
    request<Exam>('/api/exams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateExamInput>) =>
    request<Exam>(`/api/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<null>(`/api/exams/${id}`, { method: 'DELETE' }),
  createMilestone: (examId: string, title: string, dueDate?: string) =>
    request<ExamMilestone>(`/api/exams/${examId}/milestones`, {
      method: 'POST',
      body: JSON.stringify({ title, dueDate }),
    }),
  updateMilestone: (milestoneId: string, data: { title?: string; completed?: boolean; dueDate?: string }) =>
    request<ExamMilestone>(`/api/exams/milestones/${milestoneId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteMilestone: (milestoneId: string) =>
    request<null>(`/api/exams/milestones/${milestoneId}`, { method: 'DELETE' }),
};

// ============================================
// Meetings
// ============================================
export const meetingsApi = {
  getAll: () => request<Meeting[]>('/api/meetings'),
  create: (data: CreateMeetingInput) =>
    request<Meeting>('/api/meetings', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateMeetingInput & { status?: string }>) =>
    request<Meeting>(`/api/meetings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<null>(`/api/meetings/${id}`, { method: 'DELETE' }),
  rsvp: (meetingId: string, participantEmail: string, status: string) =>
    request<MeetingRsvp>(`/api/meetings/${meetingId}/rsvp`, {
      method: 'POST',
      body: JSON.stringify({ participantEmail, status }),
    }),
};

// ============================================
// Notifications
// ============================================
export const notificationsApi = {
  getAll: () => request<Notification[]>('/api/notifications'),
  markRead: (id: string) =>
    request<Notification>(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () =>
    request<null>('/api/notifications/read-all', { method: 'PUT' }),
  delete: (id: string) =>
    request<null>(`/api/notifications/${id}`, { method: 'DELETE' }),
  getSettings: () => request<NotificationSettings>('/api/notifications/settings'),
  updateSettings: (data: Partial<NotificationSettings>) =>
    request<NotificationSettings>('/api/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
