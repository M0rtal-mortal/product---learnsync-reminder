import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';

import { SERVER_CONFIG } from './config/constants';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import { SchoolPortalService } from './services/schoolPortalService';

const schoolPortalService = new SchoolPortalService();

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3003');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Static Files
 */
const REACT_BUILD_FOLDER = path.join(__dirname, '..', 'frontend', 'dist');
app.use(
  express.static(REACT_BUILD_FOLDER, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);
app.use(
  '/assets',
  express.static(path.join(REACT_BUILD_FOLDER, 'assets'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    },
  })
);

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);

// In-memory storage
const inMemoryStorage = {
  courses: [],
  exams: [],
  meetings: [],
  notifications: [],
  notificationSettings: {
    examReminders: true,
    meetingReminders: true,
    syncNotifications: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  }
};

// Courses API
app.get('/api/courses', (req, res) => {
  res.json({ success: true, data: inMemoryStorage.courses });
});

app.post('/api/courses', (req, res) => {
  const course = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  inMemoryStorage.courses.push(course);
  res.json({ success: true, data: course });
});

app.put('/api/courses/:id', (req, res) => {
  const courseId = req.params.id;
  const courseIndex = inMemoryStorage.courses.findIndex(c => c.id === courseId);
  if (courseIndex === -1) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }
  inMemoryStorage.courses[courseIndex] = {
    ...inMemoryStorage.courses[courseIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json({ success: true, data: inMemoryStorage.courses[courseIndex] });
});

app.delete('/api/courses/:id', (req, res) => {
  const courseId = req.params.id;
  const courseIndex = inMemoryStorage.courses.findIndex(c => c.id === courseId);
  if (courseIndex === -1) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }
  inMemoryStorage.courses.splice(courseIndex, 1);
  res.json({ success: true, data: null });
});

app.post('/api/courses/import', async (req, res) => {
  const { school, username, password } = req.body;
  
  // Validate input
  if (!school || !username || !password) {
    return res.status(400).json({ success: false, message: '请填写学校名称、用户名和密码' });
  }
  
  try {
    console.log(`正在登录 ${school} 信息门户...`);
    console.log(`用户名: ${username}`);
    
    // Step 1: Login to school portal and fetch courses
    const courses = await schoolPortalService.loginAndFetchCourses(school, username, password);
    
    // Step 2: Save courses to storage
    inMemoryStorage.courses = [];
    inMemoryStorage.courses.push(...courses);
    
    res.json({ success: true, data: courses, message: `成功从${school}信息门户导入 ${courses.length} 门课程` });
  } catch (error) {
    console.error('导入课程失败:', error);
    res.status(500).json({ success: false, message: '导入课程失败，请检查您的用户名和密码是否正确' });
  }
});

// Exams API
app.get('/api/exams', (req, res) => {
  res.json({ success: true, data: inMemoryStorage.exams });
});

app.post('/api/exams', (req, res) => {
  const exam = {
    id: Date.now().toString(),
    ...req.body,
    status: 'upcoming',
    prepProgress: 0,
    milestones: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  inMemoryStorage.exams.push(exam);
  res.json({ success: true, data: exam });
});

app.put('/api/exams/:id', (req, res) => {
  const examId = req.params.id;
  const examIndex = inMemoryStorage.exams.findIndex(e => e.id === examId);
  if (examIndex === -1) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }
  inMemoryStorage.exams[examIndex] = {
    ...inMemoryStorage.exams[examIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json({ success: true, data: inMemoryStorage.exams[examIndex] });
});

app.delete('/api/exams/:id', (req, res) => {
  const examId = req.params.id;
  const examIndex = inMemoryStorage.exams.findIndex(e => e.id === examId);
  if (examIndex === -1) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }
  inMemoryStorage.exams.splice(examIndex, 1);
  res.json({ success: true, data: null });
});

app.post('/api/exams/:examId/milestones', (req, res) => {
  const examId = req.params.examId;
  const exam = inMemoryStorage.exams.find(e => e.id === examId);
  if (!exam) {
    return res.status(404).json({ success: false, message: 'Exam not found' });
  }
  const milestone = {
    id: Date.now().toString(),
    examId,
    ...req.body,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!exam.milestones) exam.milestones = [];
  exam.milestones.push(milestone);
  res.json({ success: true, data: milestone });
});

app.put('/api/exams/milestones/:milestoneId', (req, res) => {
  const milestoneId = req.params.milestoneId;
  let milestoneFound = false;
  let updatedMilestone = null;
  
  for (const exam of inMemoryStorage.exams) {
    if (exam.milestones) {
      const milestoneIndex = exam.milestones.findIndex(m => m.id === milestoneId);
      if (milestoneIndex !== -1) {
        exam.milestones[milestoneIndex] = {
          ...exam.milestones[milestoneIndex],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        updatedMilestone = exam.milestones[milestoneIndex];
        milestoneFound = true;
        break;
      }
    }
  }
  
  if (!milestoneFound) {
    return res.status(404).json({ success: false, message: 'Milestone not found' });
  }
  
  res.json({ success: true, data: updatedMilestone });
});

app.delete('/api/exams/milestones/:milestoneId', (req, res) => {
  const milestoneId = req.params.milestoneId;
  let milestoneFound = false;
  
  for (const exam of inMemoryStorage.exams) {
    if (exam.milestones) {
      const milestoneIndex = exam.milestones.findIndex(m => m.id === milestoneId);
      if (milestoneIndex !== -1) {
        exam.milestones.splice(milestoneIndex, 1);
        milestoneFound = true;
        break;
      }
    }
  }
  
  if (!milestoneFound) {
    return res.status(404).json({ success: false, message: 'Milestone not found' });
  }
  
  res.json({ success: true, data: null });
});

// Meetings API
app.get('/api/meetings', (req, res) => {
  res.json({ success: true, data: inMemoryStorage.meetings });
});

app.post('/api/meetings', (req, res) => {
  const meeting = {
    id: Date.now().toString(),
    ...req.body,
    status: 'active',
    rsvps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  inMemoryStorage.meetings.push(meeting);
  res.json({ success: true, data: meeting });
});

app.put('/api/meetings/:id', (req, res) => {
  const meetingId = req.params.id;
  const meetingIndex = inMemoryStorage.meetings.findIndex(m => m.id === meetingId);
  if (meetingIndex === -1) {
    return res.status(404).json({ success: false, message: 'Meeting not found' });
  }
  inMemoryStorage.meetings[meetingIndex] = {
    ...inMemoryStorage.meetings[meetingIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json({ success: true, data: inMemoryStorage.meetings[meetingIndex] });
});

app.delete('/api/meetings/:id', (req, res) => {
  const meetingId = req.params.id;
  const meetingIndex = inMemoryStorage.meetings.findIndex(m => m.id === meetingId);
  if (meetingIndex === -1) {
    return res.status(404).json({ success: false, message: 'Meeting not found' });
  }
  inMemoryStorage.meetings.splice(meetingIndex, 1);
  res.json({ success: true, data: null });
});

app.post('/api/meetings/:meetingId/rsvp', (req, res) => {
  const meetingId = req.params.meetingId;
  const meeting = inMemoryStorage.meetings.find(m => m.id === meetingId);
  if (!meeting) {
    return res.status(404).json({ success: false, message: 'Meeting not found' });
  }
  const rsvp = {
    id: Date.now().toString(),
    meetingId,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (!meeting.rsvps) meeting.rsvps = [];
  meeting.rsvps.push(rsvp);
  res.json({ success: true, data: rsvp });
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  res.json({ success: true, data: inMemoryStorage.notifications });
});

app.put('/api/notifications/:id/read', (req, res) => {
  const notificationId = req.params.id;
  const notificationIndex = inMemoryStorage.notifications.findIndex(n => n.id === notificationId);
  if (notificationIndex === -1) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  inMemoryStorage.notifications[notificationIndex] = {
    ...inMemoryStorage.notifications[notificationIndex],
    isRead: true,
    updatedAt: new Date().toISOString()
  };
  res.json({ success: true, data: inMemoryStorage.notifications[notificationIndex] });
});

app.put('/api/notifications/read-all', (req, res) => {
  inMemoryStorage.notifications.forEach(notification => {
    notification.isRead = true;
    notification.updatedAt = new Date().toISOString();
  });
  res.json({ success: true, data: null });
});

app.delete('/api/notifications/:id', (req, res) => {
  const notificationId = req.params.id;
  const notificationIndex = inMemoryStorage.notifications.findIndex(n => n.id === notificationId);
  if (notificationIndex === -1) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  inMemoryStorage.notifications.splice(notificationIndex, 1);
  res.json({ success: true, data: null });
});

app.get('/api/notifications/settings', (req, res) => {
  res.json({ success: true, data: inMemoryStorage.notificationSettings });
});

app.put('/api/notifications/settings', (req, res) => {
  inMemoryStorage.notificationSettings = {
    ...inMemoryStorage.notificationSettings,
    ...req.body
  };
  res.json({ success: true, data: inMemoryStorage.notificationSettings });
});

/**
 * SPA Fallback
 */
app.get('*', (_req, res) => {
  res.sendFile(path.join(REACT_BUILD_FOLDER, 'index.html'));
});

/**
 * Error Handler
 */
app.use(errorHandler as ErrorRequestHandler);

/**
 * Start Server
 */
app.listen(SERVER_CONFIG.PORT, () => {
  console.log(`Server ready on port ${SERVER_CONFIG.PORT}`);
});

export default app;
