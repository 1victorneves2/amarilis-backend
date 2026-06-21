import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { OrderStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { CreateGuestOrderSchema, CreateOrderSchema, parseBody } from '../utils/validation';
import { hashPassword } from '../utils/auth';

const router = Router();

const VALID_STATUSES = Object.values(OrderStatus);

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const GUEST_EMAIL = 'guest@amarilisbeaute.com';

async function getOrCreateGuestUser(): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { email: GUEST_EMAIL },
    select: { id: true },
  });
  if (existing) return existing.id;

  const passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'));
  const created = await prisma.user.create({
    data: { email: GUEST_EMAIL, password: passwordHash, name: 'Guest', role: 'guest' },
    select: { id: true },
  });
  return created.id;
}

// ──────────────────────────────────────────────────────────────
// POST /api/orders — criar pedido (público, sem auth)
// Aceita tanto o formato legacy (customerName/Phone) quanto o
// novo formato simplificado (clientName/whatsapp).
// ──────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  // Tenta formato novo simplificado primeiro
  const body = req.body as {
    clientName?: string;
    whatsapp?: string;
    total?: number;
    items?: Array<{ id: string; quantity: number; price: number }>;
    // legacy fields
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    shippingAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    notes?: string;
  };

  const isNewFormat = !!body.clientName;

  if (isNewFormat) {
    // ── Formato novo (admin panel / WhatsApp) ──
    const { clientName, whatsapp, items, total } = body;

    if (!clientName || !whatsapp) {
      res.status(400).json({ error: 'clientName e whatsapp são obrigatórios' });
      return;
    }
    if (!items || items.length === 0) {
      res.status(400).json({ error: 'items não pode estar vazio' });
      return;
    }

    try {
      const productIds = items.map((i) => i.id);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, active: true },
        select: { id: true, name: true, stock: true },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of items) {
        const product = productMap.get(item.id);
        if (!product) {
          res.status(400).json({ error: `Produto ${item.id} não encontrado ou inativo` });
          return;
        }
        if (product.stock < item.quantity) {
          res.status(400).json({
            error: `Estoque insuficiente para "${product.name}" (disponível: ${product.stock})`,
          });
          return;
        }
      }

      const computedTotal = total ?? items.reduce((s, i) => s + i.price * i.quantity, 0);

      const order = await prisma.order.create({
        data: {
          clientName,
          whatsapp,
          total: computedTotal,
          totalAmount: computedTotal,
          status: OrderStatus.PENDING,
          items: {
            create: items.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
              unitPrice: item.price,
            })),
          },
        },
        include: {
          items: { include: { product: { select: { id: true, name: true, price: true } } } },
        },
      });

      console.log(`[Orders] Novo pedido ${order.id} — ${clientName} — R$ ${computedTotal.toFixed(2)}`);
      res.status(201).json(order);
    } catch (err) {
      console.error('[Orders] Erro ao criar pedido:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  // ── Formato legacy (site público) ──
  const result = parseBody(CreateGuestOrderSchema, req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  const { customerName, customerEmail, customerPhone, shippingAddress, city, state, zipCode, notes, items: legacyItems } = result.data;

  try {
    const productIds = legacyItems.map((i) => i.productId);
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

    const totalAmount = legacyItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const guestUserId = await getOrCreateGuestUser();

    const order = await prisma.order.create({
      data: {
        userId: guestUserId,
        status: OrderStatus.PENDING,
        totalAmount,
        total: totalAmount,
        clientName: customerName,
        whatsapp: customerPhone ?? '',
        customerName,
        customerEmail: customerEmail ?? null,
        customerPhone,
        shippingAddress,
        city,
        state,
        zipCode: zipCode ?? null,
        notes: notes ?? null,
        items: {
          create: legacyItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            price: item.unitPrice,
          })),
        },
      },
      include: {
        items: { include: { product: { select: { id: true, name: true, slug: true } } } },
      },
    });

    console.log(`[Orders] Novo pedido ${order.id} — ${customerName} — R$ ${totalAmount.toFixed(2)}`);
    res.status(201).json(order);
  } catch (err) {
    console.error('[Orders] Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/orders — listar pedidos (público temporariamente, até login admin)
// Query: ?status=PENDING&client=ana
// ──────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, client } = req.query as { status?: string; client?: string };

    const where: Record<string, unknown> = {};

    if (status) {
      const normalized = status.toUpperCase();
      if (!VALID_STATUSES.includes(normalized as OrderStatus)) {
        res.status(400).json({ error: `Status inválido. Válidos: ${VALID_STATUSES.join(', ')}` });
        return;
      }
      where['status'] = normalized as OrderStatus;
    }

    if (client) {
      where['clientName'] = { contains: client, mode: 'insensitive' };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
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

// ──────────────────────────────────────────────────────────────
// GET /api/orders/:id — detalhe (público temporariamente, até login admin)
// ──────────────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, price: true } } },
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

// ──────────────────────────────────────────────────────────────
// PATCH|PUT /api/orders/:id/status — atualizar status (admin)
// Regra crítica: CONFIRMED → desconta estoque + StockMovement
// ──────────────────────────────────────────────────────────────
async function updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
  const { status } = req.body as { status?: string };

  if (!status) {
    res.status(400).json({ error: 'status é obrigatório' });
    return;
  }

  const normalized = status.toUpperCase();
  if (!VALID_STATUSES.includes(normalized as OrderStatus)) {
    res.status(400).json({
      error: `status inválido. Válidos: ${VALID_STATUSES.join(', ')}`,
    });
    return;
  }

  const newStatus = normalized as OrderStatus;
  const { id } = req.params as { id: string };

  try {
    const current = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { select: { productId: true, quantity: true } },
      },
    });

    if (!current) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    if (newStatus === OrderStatus.CONFIRMED && current.status !== OrderStatus.CONFIRMED) {
      // Transação: verificar estoque → decrementar → StockMovement → atualizar pedido
      const updated = await prisma.$transaction(async (tx) => {
        const productIds = current.items.map((i) => i.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, stock: true },
        });

        const stockMap = new Map(products.map((p) => [p.id, p]));

        for (const item of current.items) {
          const product = stockMap.get(item.productId)!;
          if (product.stock < item.quantity) {
            throw new Error(
              `Estoque insuficiente para "${product.name}": disponível ${product.stock}, necessário ${item.quantity}`
            );
          }
        }

        // Decrementar estoque e registrar movimentos
        await Promise.all(
          current.items.map((item) =>
            tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            })
          )
        );

        await tx.stockMovement.createMany({
          data: current.items.map((item) => ({
            productId: item.productId,
            quantity: -item.quantity,
            reason: 'order_confirmed',
            orderId: id,
          })),
        });

        return tx.order.update({
          where: { id },
          data: { status: newStatus },
          include: {
            items: { include: { product: { select: { id: true, name: true, price: true } } } },
          },
        });
      });

      res.json(updated);
      return;
    }

    // Outros status: apenas atualizar
    const updated = await prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: {
        items: { include: { product: { select: { id: true, name: true, price: true } } } },
      },
    });

    res.json(updated);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith('Estoque insuficiente')) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (
      err && typeof err === 'object' && 'code' in err &&
      (err as { code: string }).code === 'P2025'
    ) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }
    console.error('[Orders] Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

router.patch('/:id/status', authMiddleware, adminMiddleware, updateOrderStatus);
router.put('/:id/status', authMiddleware, adminMiddleware, updateOrderStatus);

// ──────────────────────────────────────────────────────────────
// POST /api/orders/authenticated — compatibilidade legacy
// ──────────────────────────────────────────────────────────────
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
          status: OrderStatus.PENDING,
          totalAmount,
          total: totalAmount,
          clientName: '',
          whatsapp: '',
          shippingAddress,
          paymentId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              price: item.unitPrice,
            })),
          },
        },
        include: {
          items: { include: { product: { select: { id: true, name: true, slug: true } } } },
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
