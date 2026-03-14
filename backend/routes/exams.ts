import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { examRepository } from '../repositories/exams';
import { insertExamSchema, updateExamSchema, insertExamMilestoneSchema, updateExamMilestoneSchema } from '../db/schema';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticateJWT);

// GET /api/exams
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const exams = await examRepository.findByUserId(userId);
    // Attach milestones
    const result = await Promise.all(
      exams.map(async (exam) => ({
        ...exam,
        milestones: await examRepository.getMilestones(exam.id),
      }))
    );
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// POST /api/exams
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = insertExamSchema.parse({ ...req.body, userId });
    const exam = await examRepository.create(validated);
    res.status(201).json({ success: true, data: { ...exam, milestones: [] } });
  } catch (e) { next(e); }
});

// PUT /api/exams/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const validated = updateExamSchema.parse(req.body);
    const exam = await examRepository.update(id, userId, validated);
    if (!exam) throw new AppError('Exam not found', 404);
    const milestones = await examRepository.getMilestones(id);
    res.json({ success: true, data: { ...exam, milestones } });
  } catch (e) { next(e); }
});

// DELETE /api/exams/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const deleted = await examRepository.delete(id, userId);
    if (!deleted) throw new AppError('Exam not found', 404);
    res.json({ success: true, data: null });
  } catch (e) { next(e); }
});

// GET /api/exams/:id/milestones
router.get('/:id/milestones', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const milestones = await examRepository.getMilestones(id);
    res.json({ success: true, data: milestones });
  } catch (e) { next(e); }
});

// POST /api/exams/:id/milestones
router.post('/:id/milestones', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const examId = req.params.id as string;
    const validated = insertExamMilestoneSchema.parse({ ...req.body, examId });
    const milestone = await examRepository.createMilestone(validated);
    res.status(201).json({ success: true, data: milestone });
  } catch (e) { next(e); }
});

// PUT /api/exams/milestones/:milestoneId
router.put('/milestones/:milestoneId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const milestoneId = req.params.milestoneId as string;
    const validated = updateExamMilestoneSchema.parse(req.body);
    const milestone = await examRepository.updateMilestone(milestoneId, validated);
    if (!milestone) throw new AppError('Milestone not found', 404);
    res.json({ success: true, data: milestone });
  } catch (e) { next(e); }
});

// DELETE /api/exams/milestones/:milestoneId
router.delete('/milestones/:milestoneId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const milestoneId = req.params.milestoneId as string;
    const deleted = await examRepository.deleteMilestone(milestoneId);
    if (!deleted) throw new AppError('Milestone not found', 404);
    res.json({ success: true, data: null });
  } catch (e) { next(e); }
});

export default router;
