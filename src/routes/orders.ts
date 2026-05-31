import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { CreateOrderSchema, parseBody } from '../utils/validation';

const router = Router();

// POST /api/orders — create a new order
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { data, error } = parseBody(CreateOrderSchema, req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  try {
    // Verify all products exist and have sufficient stock
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: { id: true, name: true, stock: true, price: true },
    });

    if (products.length !== productIds.length) {
      res.status(400).json({ error: 'One or more products not found or inactive' });
      return;
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        res.status(400).json({
          error: `Insufficient stock for "${product.name}" (available: ${product.stock})`,
        });
        return;
      }
    }

    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // Create order + items and decrement stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: req.userId!,
          status: 'pending',
          totalAmount,
          shippingAddress: data.shippingAddress,
          paymentId: data.paymentId,
          items: {
            create: data.items.map((item) => ({
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

      // Decrement stock
      await Promise.all(
        data.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        )
      );

      return created;
    });

    res.status(201).json(order);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/my — current user's order history
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
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id — order detail (owner or admin only)
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, slug: true, price: true, images: true } } },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Check that requester owns the order (or is admin via separate route if needed)
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (order.userId !== req.userId && requestingUser?.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(order);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
