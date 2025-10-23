import { z } from 'zod'

export const MAX_UPLOAD_SIZE = 1024 * 1024 * 2 // 2MB
export const ACCEPTED_FILE_TYPES = ['image/png', 'image/jpg', 'image/jpeg']

export type DomainSettingsProps = {
  domain?: string
  image?: any
  welcomeMessage?: string
}

export type HelpDeskQuestionsProps = {
  question: string
  answer: string
}

export type AddProductProps = {
  name: string
  image: any
  price: string
  materialId?: string
  width?: string
  weight?: string
  color?: string
  textureId?: string
  stock?: string
  unit?: string
  minStock?: string
  sku?: string
  salePrice?: string
  categoryId?: string
  featured?: boolean
  description?: string
  colors?: string
  seasonId?: string
  care?: string
}

export type FilterQuestionsProps = {
  question: string
}

export const AddDomainSchema = z.object({
  domain: z
    .string()
    .min(2, { message: 'El nombre de la empresa debe tener al menos 2 caracteres' })
    .max(50, { message: 'El nombre de la empresa no puede exceder 50 caracteres' })
    .refine(
      (value) => /^[A-Za-z0-9\s\-_]+$/.test(value ?? ''),
      'El nombre de la empresa solo puede contener letras, números, espacios, guiones y guiones bajos'
    ),
  image: z
    .any()
    .refine((files) => files?.[0]?.size <= MAX_UPLOAD_SIZE, {
      message: 'El tamaño del archivo debe ser menor a 2MB',
    })
    .refine((files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type), {
      message: 'Solo se aceptan archivos JPG, JPEG & PNG',
    }),
})

export const DomainSettingsSchema = z
  .object({
    domain: z
      .string()
      .min(2, { message: 'El nombre de la empresa debe tener al menos 2 caracteres' })
      .max(50, { message: 'El nombre de la empresa no puede exceder 50 caracteres' })
      .refine(
        (value) => /^[A-Za-z0-9\s\-_]+$/.test(value ?? ''),
        'El nombre de la empresa solo puede contener letras, números, espacios, guiones y guiones bajos'
      )
      .optional()
      .or(z.literal('').transform(() => undefined)),
    image: z.any().optional(),
    welcomeMessage: z
      .string()
      .min(6, 'El mensaje debe tener al menos 6 caracteres')
      .optional()
      .or(z.literal('').transform(() => undefined)),
  })
  .refine(
    (schema) => {
      if (schema.image?.length) {
        if (
          ACCEPTED_FILE_TYPES.includes(schema.image?.[0].type!) &&
          schema.image?.[0].size <= MAX_UPLOAD_SIZE
        ) {
          return true
        }
      }
      if (!schema.image?.length) {
        return true
      }
    },
    {
      message:
        'El archivo debe ser menor a 2MB, y solo se aceptan archivos PNG, JPEG & JPG',
      path: ['image'],
    }
  )

export const HelpDeskQuestionsSchema = z.object({
  question: z.string().min(1, { message: 'La pregunta no puede estar vacía' }),
  answer: z.string().min(1, { message: 'La respuesta no puede estar vacía' }),
})

export const FilterQuestionsSchema = z.object({
  question: z.string().min(1, { message: 'La pregunta no puede estar vacía' }),
})

export const AddProductSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
  image: z
    .any()
    .refine((files) => files?.[0]?.size <= MAX_UPLOAD_SIZE, {
      message: 'El tamaño del archivo debe ser menor a 2MB',
    })
    .refine((files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type), {
      message: 'Solo se aceptan archivos JPG, JPEG & PNG',
    }),
  price: z.string(),
  // Información técnica de la tela (IDs de relaciones)
  materialId: z.string().optional(),
  width: z.string().optional(),
  weight: z.string().optional(),
  color: z.string().optional(),
  textureId: z.string().optional(),
  // Información de inventario
  stock: z.string().optional(),
  unit: z.string().optional(),
  minStock: z.string().optional(),
  sku: z.string().optional(),
  // Información de venta (IDs de relaciones)
  salePrice: z.string().optional(),
  categoryId: z.string().optional(),
  featured: z.boolean().optional(),
  description: z.string().optional(),
  colors: z.string().optional(), // Será convertido a array
  // Temporada (ID de relación)
  seasonId: z.string().optional(),
  care: z.string().optional(),
})
