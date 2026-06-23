import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/stock — lista todos os produtos com status de estoque
router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        stockAlert: { select: { minStock: true, active: true } },
      },
      orderBy: { name: 'asc' },
    });

    const result = products.map((p) => {
      const minStock = p.stockAlert?.minStock ?? 5;
      let status: 'ok' | 'low' | 'out';
      if (p.stock === 0) status = 'out';
      else if (p.stock <= minStock) status = 'low';
      else status = 'ok';

      return { id: p.id, name: p.name, stock: p.stock, minStock, status };
    });

    res.json(result);
  } catch (err) {
    console.error('[Stock] Erro ao listar estoque:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stock/:productId/movements — últimos 50 movimentos do produto
router.get('/:productId/movements', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { productId } = req.params as { productId: string };

  try {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(movements);
  } catch (err) {
    console.error('[Stock] Erro ao listar movimentos:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stock/:productId/adjust — ajuste manual de estoque
router.post('/:productId/adjust', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { productId } = req.params as { productId: string };
  const { quantity, reason } = req.body as { quantity?: number; reason?: string };

  if (quantity === undefined || typeof quantity !== 'number') {
    res.status(400).json({ error: 'quantity é obrigatório e deve ser um número' });
    return;
  }
  if (!reason || typeof reason !== 'string') {
    res.status(400).json({ error: 'reason é obrigatório' });
    return;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true },
    });

    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      res.status(400).json({
        error: `Ajuste deixaria o estoque negativo (atual: ${product.stock}, ajuste: ${quantity})`,
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.stockMovement.create({
        data: {
          productId,
          type: 'ADJUSTMENT',
          quantity,
          reason,
        },
      });

      return tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
        select: { id: true, name: true, stock: true },
      });
    });

    res.json(updated);
  } catch (err) {
    console.error('[Stock] Erro ao ajustar estoque:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/stock/:productId/alert — configurar alerta de estoque mínimo
router.put('/:productId/alert', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { productId } = req.params as { productId: string };
  const { minStock, active } = req.body as { minStock?: number; active?: boolean };

  if (minStock === undefined || typeof minStock !== 'number' || minStock < 0) {
    res.status(400).json({ error: 'minStock é obrigatório e deve ser um número >= 0' });
    return;
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const alert = await prisma.stockAlert.upsert({
      where: { productId },
      update: {
        minStock,
        active: active ?? true,
      },
      create: {
        productId,
        minStock,
        active: active ?? true,
      },
    });

    res.json(alert);
  } catch (err) {
    console.error('[Stock] Erro ao configurar alerta:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
