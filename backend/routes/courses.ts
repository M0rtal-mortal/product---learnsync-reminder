import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { courseRepository } from '../repositories/courses';
import { insertCourseSchema, updateCourseSchema } from '../db/schema';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticateJWT);

// GET /api/courses
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const data = await courseRepository.findByUserId(userId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// POST /api/courses
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = insertCourseSchema.parse({ ...req.body, userId });
    const course = await courseRepository.create(validated);
    res.status(201).json({ success: true, data: course });
  } catch (e) { next(e); }
});

// POST /api/courses/import - import from academic affairs system
router.post('/import', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    // Delete existing imported courses
    await courseRepository.deleteByUserId(userId);
    
    // Simulate API call to school information portal
    // In a real implementation, this would be an actual API call
    // For now, we'll generate courses based on the current semester
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const semester = currentMonth <= 6 ? `${currentYear}春季` : `${currentYear}秋季`;
    
    // Create courses based on the current semester
    const sampleCourses = [
      { userId, name: '高等数学', teacher: '张教授', location: '主楼A101', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester },
      { userId, name: '大学英语', teacher: '李教授', location: '主楼B201', dayOfWeek: 0, startTime: '14:00', endTime: '15:40', color: 'secondary', isImported: true, semester },
      { userId, name: '管理学原理', teacher: '王教授', location: '主楼C301', dayOfWeek: 1, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester },
      { userId, name: '高等数学', teacher: '张教授', location: '主楼A101', dayOfWeek: 2, startTime: '14:00', endTime: '15:40', color: 'primary', isImported: true, semester },
      { userId, name: '市场营销学', teacher: '陈教授', location: '主楼A301', dayOfWeek: 3, startTime: '08:00', endTime: '09:40', color: 'primary', isImported: true, semester },
      { userId, name: '经济学基础', teacher: '王教授', location: '主楼B205', dayOfWeek: 3, startTime: '10:00', endTime: '11:40', color: 'secondary', isImported: true, semester },
      { userId, name: '统计学', teacher: '刘教授', location: '主楼D102', dayOfWeek: 4, startTime: '10:00', endTime: '11:40', color: 'primary', isImported: true, semester },
    ];
    
    const created = [];
    for (const c of sampleCourses) {
      const validated = insertCourseSchema.parse(c);
      const course = await courseRepository.create(validated);
      created.push(course);
    }
    
    res.json({ success: true, data: created, message: `成功从学校信息门户导入 ${created.length} 门课程` });
  } catch (e) { next(e); }
});

// PUT /api/courses/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const validated = updateCourseSchema.parse(req.body);
    const course = await courseRepository.update(id, userId, validated);
    if (!course) throw new AppError('Course not found', 404);
    res.json({ success: true, data: course });
  } catch (e) { next(e); }
});

// DELETE /api/courses/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const deleted = await courseRepository.delete(id, userId);
    if (!deleted) throw new AppError('Course not found', 404);
    res.json({ success: true, data: null });
  } catch (e) { next(e); }
});

export default router;
