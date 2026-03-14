import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { meetingRepository } from '../repositories/meetings';
import { insertMeetingSchema, updateMeetingSchema, insertMeetingRsvpSchema } from '../db/schema';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticateJWT);

// GET /api/meetings
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const meetingsList = await meetingRepository.findByUserId(userId);
    const result = await Promise.all(
      meetingsList.map(async (m) => ({
        ...m,
        rsvps: await meetingRepository.getRsvps(m.id),
      }))
    );
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// POST /api/meetings
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = insertMeetingSchema.parse({ ...req.body, userId });
    const meeting = await meetingRepository.create(validated);
    // Auto-create RSVPs for participants
    if (req.body.participants) {
      const emails = (req.body.participants as string).split(',').map((e: string) => e.trim()).filter(Boolean);
      for (const email of emails) {
        await meetingRepository.upsertRsvp(
          insertMeetingRsvpSchema.parse({ meetingId: meeting.id, participantEmail: email, status: 'pending' })
        );
      }
    }
    const rsvps = await meetingRepository.getRsvps(meeting.id);
    res.status(201).json({ success: true, data: { ...meeting, rsvps } });
  } catch (e) { next(e); }
});

// PUT /api/meetings/:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const validated = updateMeetingSchema.parse(req.body);
    const meeting = await meetingRepository.update(id, userId, validated);
    if (!meeting) throw new AppError('Meeting not found', 404);
    const rsvps = await meetingRepository.getRsvps(id);
    res.json({ success: true, data: { ...meeting, rsvps } });
  } catch (e) { next(e); }
});

// DELETE /api/meetings/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const deleted = await meetingRepository.delete(id, userId);
    if (!deleted) throw new AppError('Meeting not found', 404);
    res.json({ success: true, data: null });
  } catch (e) { next(e); }
});

// POST /api/meetings/:id/rsvp
router.post('/:id/rsvp', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const meetingId = req.params.id as string;
    const validated = insertMeetingRsvpSchema.parse({ ...req.body, meetingId });
    const rsvp = await meetingRepository.upsertRsvp(validated);
    res.json({ success: true, data: rsvp });
  } catch (e) { next(e); }
});

export default router;
