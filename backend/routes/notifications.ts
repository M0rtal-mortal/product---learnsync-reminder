import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { notificationRepository } from '../repositories/notifications';
import { updateNotificationSettingsSchema } from '../db/schema';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticateJWT);

// GET /api/notifications
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const data = await notificationRepository.findByUserId(userId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const notification = await notificationRepository.markRead(id, userId);
    if (!notification) throw new AppError('Notification not found', 404);
    res.json({ success: true, data: notification });
  } catch (e) { next(e); }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await notificationRepository.markAllRead(userId);
    res.json({ success: true, data: null });
  } catch (e) { next(e); }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const deleted = await notificationRepository.delete(id, userId);
    if (!deleted) throw new AppError('Notification not found', 404);
    res.json({ success: true, data: null });
  } catch (e) { next(e); }
});

// GET /api/notifications/settings
router.get('/settings', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    let settings = await notificationRepository.getSettings(userId);
    if (!settings) {
      settings = await notificationRepository.upsertSettings(userId, {});
    }
    res.json({ success: true, data: settings });
  } catch (e) { next(e); }
});

// PUT /api/notifications/settings
router.put('/settings', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = updateNotificationSettingsSchema.parse(req.body);
    const settings = await notificationRepository.upsertSettings(userId, validated);
    res.json({ success: true, data: settings });
  } catch (e) { next(e); }
});

export default router;
