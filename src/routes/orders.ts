import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { CreateGuestOrderSchema, CreateOrderSchema, parseBody } from '../utils/validation';
import { hashPassword } from '../utils/auth';

const router = Router();

const GUEST_EMAIL = 'guest@amarilisbeaute.com';

async function getOrCreateGuestUser(): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { email: GUEST_EMAIL },
    select: { id: true },
  });
  if (existing) return existing.id;

  const passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'));
  const created = await prisma.user.create({
    data: {
      email: GUEST_EMAIL,
      password: passwordHash,
      name: 'Guest',
      role: 'guest',
    },
    select: { id: true },
  });
  return created.id;
}

// POST /api/orders — criar pedido (público, sem auth)
router.post('/', async (req: Request, res: Response) => {
  const result = parseBody(CreateGuestOrderSchema, req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    city,
    state,
    zipCode,
    notes,
    items,
  } = result.data;

  try {
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: { id: true, name: true },
    });

    const foundIds = new Set(products.map((p) => p.id));
    const missingId = productIds.find((id) => !foundIds.has(id));
    if (missingId) {
      res.status(400).json({ error: `Produto ${missingId} não encontrado ou inativo` });
      return;
    }

    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const guestUserId = await getOrCreateGuestUser();

    const order = await prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          userId: guestUserId,
          status: 'pending',
          totalAmount,
          customerName,
          customerEmail: customerEmail ?? null,
          customerPhone,
          shippingAddress,
          city,
          state,
          zipCode: zipCode ?? null,
          notes: notes ?? null,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          items: {
            include: { product: { select: { id: true, name: true, slug: true } } },
          },
        },
      });
    });

    console.log(
      `[Orders] Novo pedido ${order.id} — ${customerName} — R$ ${totalAmount.toFixed(2)}`
    );
    res.status(201).json(order);
  } catch (err) {
    console.error('[Orders] Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders — listar todos os pedidos (admin only)
router.get('/', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
    res.json(orders);
  } catch (err) {
    console.error('[Orders] Erro ao listar pedidos:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/my — pedidos do usuário logado
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, slug: true, images: true } } },
        },
      },
    });
    res.json(orders);
  } catch (err) {
    console.error('[Orders] Erro ao listar pedidos do usuário:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id — detalhe de pedido (admin only)
router.get('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, price: true, images: true } },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    res.json(order);
  } catch (err) {
    console.error('[Orders] Erro ao buscar pedido:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/status — atualizar status (admin only)
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
  const { status } = req.body as { status?: string };

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `status deve ser um de: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    const { id } = req.params as { id: string };
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
    res.json(order);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'P2025'
    ) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }
    console.error('[Orders] Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mantido para compatibilidade com rotas autenticadas existentes
router.post('/authenticated', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = parseBody(CreateOrderSchema, req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  const { items, shippingAddress, paymentId } = result.data;

  try {
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: { id: true, name: true, stock: true },
    });

    if (products.length !== productIds.length) {
      res.status(400).json({ error: 'Um ou mais produtos não encontrados ou inativos' });
      return;
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        res.status(400).json({
          error: `Estoque insuficiente para "${product.name}" (disponível: ${product.stock})`,
        });
        return;
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: req.userId!,
          status: 'pending',
          totalAmount,
          shippingAddress,
          paymentId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: {
          items: {
            include: { product: { select: { id: true, name: true, slug: true } } },
          },
        },
      });

      await Promise.all(
        items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        )
      );

      return created;
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('[Orders] Erro ao criar pedido autenticado:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
