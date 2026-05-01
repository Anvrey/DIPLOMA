



import { Router } from 'express';
import { createUser, verifyUser, getUserById } from '../services/userStore.js';
import { generateToken, authRequired, type AuthRequest } from '../middleware/auth.js';

const router = Router();


router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: '  \': email, password, name' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: '    6 ' });
      return;
    }

    const user = await createUser(email, password, name);
    const token = generateToken(user.id);

    res.status(201).json({ token, user });
  } catch (error: any) {
    if (error.message?.includes(' ')) {
      res.status(409).json({ error: error.message });
    } else {
      console.error(' :', error);
      res.status(500).json({ error: '  ' });
    }
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email   \'' });
      return;
    }

    const user = await verifyUser(email, password);
    if (!user) {
      res.status(401).json({ error: ' email  ' });
      return;
    }

    const token = generateToken(user.id);
    res.json({ token, user });
  } catch (error) {
    console.error(' :', error);
    res.status(500).json({ error: '  ' });
  }
});


router.get('/me', authRequired, (req: AuthRequest, res) => {
  const user = getUserById(req.userId!);
  if (!user) {
    res.status(404).json({ error: '  ' });
    return;
  }
  res.json({ user });
});

export default router;
