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
}

export type FilterQuestionsProps = {
  question: string
}

export const AddDomainSchema = z.object({
  domain: z
    .string()
    .min(4, { message: 'Un dominio debe tener al menos 3 caracteres' })
    .refine(
      (value) =>
        /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,3}$/.test(value ?? ''),
      'Este no es un dominio válido'
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
      .min(4, { message: 'Un dominio debe tener al menos 3 caracteres' })
      .refine(
        (value) =>
          /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,3}$/.test(value ?? ''),
        'Este no es un dominio válido'
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
})
