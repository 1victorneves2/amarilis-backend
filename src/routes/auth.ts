import { Router } from 'express';
import prisma from '../lib/prisma';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { RegisterSchema, LoginSchema, parseBody } from '../utils/validation';

const router = Router();

router.post('/register', async (req, res) => {
  const { data, error } = parseBody(RegisterSchema, req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(400).json({ error: 'Email already in use' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: await hashPassword(data.password),
        name: data.name,
        phone: data.phone,
      },
    });

    const token = generateToken(user.id);
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { data, error } = parseBody(LoginSchema, req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await verifyPassword(data.password, user.password);
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
