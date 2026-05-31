import { Router } from 'express';
import prisma from '../lib/prisma';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { RegisterSchema, LoginSchema, parseBody } from '../utils/validation';

const router = Router();

router.post('/register', async (req, res) => {
  const result = parseBody(RegisterSchema, req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  const { email, password, name, phone } = result.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'Email already in use' });
      return;
    }

    const user = await prisma.user.create({
      data: { email, password: await hashPassword(password), name, phone },
    });

    const token = generateToken(user.id);
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const result = parseBody(LoginSchema, req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user.id);
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
