import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { hashPassword } from '../utils/auth';

const router = Router();

const SEED_TOKEN = process.env.SEED_TOKEN ?? 'Amarilis_Seed_2024_Secret';
const ADMIN_EMAIL = 'admin@amarilis.com';
const ADMIN_PASSWORD = 'Amarilis@2024';

// POST /api/seed/admin — endpoint temporário, remover após uso
router.post('/admin', async (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };

  if (!token || token !== SEED_TOKEN) {
    res.status(403).json({ error: 'Token inválido' });
    return;
  }

  try {
    const hashed = await hashPassword(ADMIN_PASSWORD);

    const user = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: { password: hashed, role: 'admin' },
      create: {
        email: ADMIN_EMAIL,
        password: hashed,
        name: 'Admin',
        role: 'admin',
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    console.log('[Seed] Admin criado/atualizado:', user.email);
    res.json({ message: 'Admin criado com sucesso', user });
  } catch (err) {
    console.error('[Seed] Erro:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
