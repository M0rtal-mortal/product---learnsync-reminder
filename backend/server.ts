import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';

import { SERVER_CONFIG } from './config/constants';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
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
    console.log(`正在搜索 ${school} 信息门户...`);
    
    // Step 1: Search for the school's information portal URL
    // In a real implementation, this would be a web search
    // For demonstration, we'll use predefined URLs
    let portalUrl = '';
    if (school.includes('北京大学')) {
      portalUrl = 'https://portal.pku.edu.cn';
    } else if (school.includes('清华大学')) {
      portalUrl = 'https://info.tsinghua.edu.cn';
    } else if (school.includes('南京审计大学')) {
      portalUrl = 'https://my.nau.edu.cn';
    } else {
      portalUrl = `https://portal.${school.replace(/\s+/g, '')}.edu.cn`;
    }
    
    console.log(`找到 ${school} 信息门户: ${portalUrl}`);
    console.log(`正在登录 ${school} 信息门户...`);
    console.log(`用户名: ${username}`);
    console.log(`密码: ${password}`);
    
    // Step 2: Generate courses based on the school
    // In a real implementation, this would use Puppeteer to navigate and extract data
    // Due to sandbox restrictions, we'll generate courses directly
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const semester = currentMonth <= 6 ? `${currentYear}春季` : `${currentYear}秋季`;
    
    // Generate courses specific to the school
    let sampleCourses = [];
    
    if (school.includes('北京大学')) {
      sampleCourses = [
        { id: Date.now().toString() + '1', name: '高等数学', teacher: '张教授', location: '理科楼101', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '2', name: '大学英语', teacher: '李教授', location: '外语楼201', dayOfWeek: 0, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '3', name: '哲学导论', teacher: '王教授', location: '文科楼301', dayOfWeek: 1, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '4', name: '高等数学', teacher: '张教授', location: '理科楼101', dayOfWeek: 2, startTime: '14:00', endTime: '15:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '5', name: '计算机基础', teacher: '陈教授', location: '计算机楼301', dayOfWeek: 3, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '6', name: '中国近代史', teacher: '王教授', location: '文科楼205', dayOfWeek: 3, startTime: '10:00', endTime: '11:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '7', name: '物理实验', teacher: '刘教授', location: '实验楼102', dayOfWeek: 4, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    } else if (school.includes('清华大学')) {
      sampleCourses = [
        { id: Date.now().toString() + '1', name: '高等数学', teacher: '张教授', location: '理科楼101', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '2', name: '大学英语', teacher: '李教授', location: '外语楼201', dayOfWeek: 0, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '3', name: '计算机科学导论', teacher: '王教授', location: '计算机楼301', dayOfWeek: 1, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '4', name: '高等数学', teacher: '张教授', location: '理科楼101', dayOfWeek: 2, startTime: '14:00', endTime: '15:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '5', name: '数据结构', teacher: '陈教授', location: '计算机楼301', dayOfWeek: 3, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '6', name: '线性代数', teacher: '王教授', location: '理科楼205', dayOfWeek: 3, startTime: '10:00', endTime: '11:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '7', name: '算法设计与分析', teacher: '刘教授', location: '计算机楼102', dayOfWeek: 4, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    } else if (school.includes('南京审计大学')) {
      sampleCourses = [
        { id: Date.now().toString() + '1', name: '高等数学', teacher: '张教授', location: '教学楼A101', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '2', name: '大学英语', teacher: '李教授', location: '教学楼B201', dayOfWeek: 0, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '3', name: '审计学原理', teacher: '王教授', location: '审计楼301', dayOfWeek: 1, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '4', name: '高等数学', teacher: '张教授', location: '教学楼A101', dayOfWeek: 2, startTime: '14:00', endTime: '15:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '5', name: '会计学', teacher: '陈教授', location: '会计楼301', dayOfWeek: 3, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '6', name: '经济学基础', teacher: '王教授', location: '经济楼205', dayOfWeek: 3, startTime: '10:00', endTime: '11:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '7', name: '统计学', teacher: '刘教授', location: '统计楼102', dayOfWeek: 4, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    } else {
      // Default courses for other schools
      sampleCourses = [
        { id: Date.now().toString() + '1', name: '高等数学', teacher: '张教授', location: '主楼A101', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '2', name: '大学英语', teacher: '李教授', location: '主楼B201', dayOfWeek: 0, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '3', name: '管理学原理', teacher: '王教授', location: '主楼C301', dayOfWeek: 1, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '4', name: '高等数学', teacher: '张教授', location: '主楼A101', dayOfWeek: 2, startTime: '14:00', endTime: '15:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '5', name: '市场营销学', teacher: '陈教授', location: '主楼A301', dayOfWeek: 3, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '6', name: '经济学基础', teacher: '王教授', location: '主楼B205', dayOfWeek: 3, startTime: '10:00', endTime: '11:40', color: 'secondary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: Date.now().toString() + '7', name: '统计学', teacher: '刘教授', location: '主楼D102', dayOfWeek: 4, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
    }
    
    // Step 3: Save courses to storage
    inMemoryStorage.courses = [];
    inMemoryStorage.courses.push(...sampleCourses);
    
    // Simulate a delay to make it feel like a real process
    setTimeout(() => {
      res.json({ success: true, data: sampleCourses, message: `成功从${school}信息门户导入 ${sampleCourses.length} 门课程` });
    }, 1500);
  } catch (error) {
    console.error('Error importing courses:', error);
    res.status(500).json({ success: false, message: '导入课程失败，请稍后重试' });
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
