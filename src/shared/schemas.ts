import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(120).optional().nullable(),
  category: z.enum(['liquor', 'beer', 'soda', 'club_soda', 'water', 'other']),
  sku: z.string().max(64).optional().nullable(),
  barcode: z.string().max(64).optional().nullable(),
  stock_unit: z.enum(['ml', 'bottle', 'tin', 'can', 'case', 'piece']),
  package_size_amount: z.coerce.number().positive().optional().nullable(),
  package_size_unit: z.enum(['ml', 'litre', 'bottle', 'tin', 'can']).optional().nullable(),
  bottle_size_ml: z.coerce.number().int().positive().optional().nullable(),
  tax_treatment: z.enum(['outside_gst_excise_vat', 'gst_5', 'gst_18', 'gst_28_cess']),
  reorder_level: z.coerce.number().min(0).optional().nullable(),
  is_active: z.boolean().optional(),
});

export const ProductCreateSchema = ProductSchema;
export const ProductUpdateSchema = ProductSchema.partial();

export const CountSchema = z.object({
  productId: z.string().uuid(),
  amount: z.coerce.number().min(0).max(1e9),
  unit: z.enum(['ml', 'bottle', 'tin', 'can', 'case', 'piece']),
});

export const MovementSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(['opening', 'receipt', 'transfer_in', 'transfer_out',
                'consumption', 'spillage', 'adjustment']),
  amount: z.coerce.number(),
  unit: z.enum(['ml', 'bottle', 'tin', 'can', 'case', 'piece']),
  reason: z.string().max(500).optional(),
});
