



import { Router } from 'express';
import { addFeedbackEvent } from '../services/feedbackStore.js';
import { authRequired, type AuthRequest } from '../middleware/auth.js';

const router = Router();


router.post('/', authRequired, (req: AuthRequest, res) => {
  const { trackId, action, listenDuration } = req.body;

  if (!trackId || !action) {
    res.status(400).json({ error: 'trackId  action \'' });
    return;
  }

  const validActions = ['like', 'dislike', 'skip', 'playlist_add', 'play'];
  if (!validActions.includes(action)) {
    res.status(400).json({ error: ` . : ${validActions.join(', ')}` });
    return;
  }

  const event = addFeedbackEvent(trackId, req.userId!, action, listenDuration);
  console.log(` Feedback: user=${req.userId} track=${trackId} action=${action}`);

  res.status(201).json(event);
});

export default router;
