import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(3).max(50),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(3).max(50).optional(),
  description: z.string().optional(),
});

export const CreateProductSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with hyphens'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

export const UpdateProductSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.string().nullable().optional(),
  images: z.array(z.string().url()).optional(),
  active: z.boolean().optional(),
});

export const CreateOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1, 'productId is required'),
      quantity: z.number().int().min(1, 'quantity must be at least 1'),
      unitPrice: z.number().positive('unitPrice must be positive'),
    })
  ).min(1, 'Order must have at least one item'),
  shippingAddress: z.string().optional(),
  paymentId: z.string().optional(),
});

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return { data: null, error: messages };
  }
  return { data: result.data, error: null };
}
