import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { parseBody } from '../utils/validation';

const router = Router();

const WhatsAppOrderSchema = z.object({
  customer: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8),
    address: z.string().min(5),
    city: z.string().min(2),
    state: z.string().length(2),
    zipCode: z.string().optional(),
    notes: z.string().optional(),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      quantity: z.number().int().min(1),
      price: z.number().positive(),
      subtotal: z.number().positive(),
    })
  ).min(1),
  totalAmount: z.number().positive(),
  timestamp: z.string(),
});

type WhatsAppOrder = z.infer<typeof WhatsAppOrderSchema>;

function buildStoreMessage(order: WhatsAppOrder): string {
  const { customer, items, totalAmount, timestamp } = order;

  const itemsList = items
    .map((item) => `• ${item.quantity}x ${item.productName} — R$ ${item.subtotal.toFixed(2).replace('.', ',')}`)
    .join('\n');

  return [
    '🎉 *NOVO PEDIDO — Amarilis Beauté*',
    '',
    `👤 *Cliente:* ${customer.fullName}`,
    `📧 *Email:* ${customer.email}`,
    `📱 *WhatsApp:* ${customer.phone}`,
    '',
    '📍 *Endereço:*',
    customer.address,
    `${customer.city}, ${customer.state}${customer.zipCode ? ` — CEP ${customer.zipCode}` : ''}`,
    '',
    '🛍️ *Produtos:*',
    itemsList,
    '',
    `💰 *Total:* R$ ${totalAmount.toFixed(2).replace('.', ',')}`,
    '',
    `📝 *Observações:* ${customer.notes || 'Nenhuma'}`,
    '',
    `⏰ *Horário:* ${new Date(timestamp).toLocaleString('pt-BR')}`,
  ].join('\n');
}

function buildConfirmationMessage(order: WhatsAppOrder): string {
  const { customer, totalAmount } = order;
  return [
    '✅ *Pedido recebido com sucesso!*',
    '',
    `Olá ${customer.fullName},`,
    '',
    'Seu pedido foi registrado. Em breve entraremos em contato para confirmar a entrega.',
    '',
    `🛍️ *Total:* R$ ${totalAmount.toFixed(2).replace('.', ',')}`,
    '',
    'Obrigada por comprar na *Amarilis Beauté*! 💖',
  ].join('\n');
}

async function sendViaWhatsApp(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE;

  if (!sid || !token || !from || sid.startsWith('your_')) {
    console.log('[WhatsApp] Twilio not configured — message would be:\n', body);
    return;
  }

  // Dynamic import so app starts fine without valid credentials
  const twilio = await import('twilio');
  const client = twilio.default(sid, token);

  await client.messages.create({
    body,
    from: `whatsapp:${from}`,
    to: `whatsapp:${to}`,
  });
}

// POST /api/orders/whatsapp — guest checkout via WhatsApp
router.post('/', async (req: Request, res: Response) => {
  const result = parseBody(WhatsAppOrderSchema, req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  const order = result.data;
  const storePhone = process.env.STORE_WHATSAPP;

  try {
    // Always try to notify the store
    if (storePhone) {
      await sendViaWhatsApp(storePhone, buildStoreMessage(order));
    } else {
      console.log('[WhatsApp] STORE_WHATSAPP not set — skipping store notification');
      console.log('[WhatsApp] Order from:', order.customer.fullName, '| Total: R$', order.totalAmount);
    }

    // Send confirmation to customer (best-effort)
    try {
      await sendViaWhatsApp(order.customer.phone, buildConfirmationMessage(order));
    } catch {
      // Non-fatal: customer confirmation failure doesn't cancel the order
      console.warn('[WhatsApp] Could not send confirmation to customer');
    }

    res.status(201).json({
      success: true,
      message: 'Pedido recebido com sucesso',
    });
  } catch (err) {
    console.error('[WhatsApp] Error:', err);
    res.status(500).json({ error: 'Falha ao processar pedido' });
  }
});

export default router;
