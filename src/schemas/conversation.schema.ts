import { ZodType, z } from 'zod'
import { ACCEPTED_FILE_TYPES, MAX_UPLOAD_SIZE } from './settings.schema'

export type ConversationSearchProps = {
  query: string
  domain: string
}

export type ChatBotMessageProps = {
  content?: string
  image?: any
}

export const ConversationSearchSchema = z.object({
  query: z.string().min(1, { message: 'Debes ingresar una consulta' }),
  domain: z.string().min(1, { message: 'Debes seleccionar una empresa' }),
});

export const ChatBotMessageSchema: ZodType<ChatBotMessageProps> = z
  .object({
    content: z
      .string()
      .min(1)
      .optional()
      .or(z.literal('').transform(() => undefined)),
    image: z.any().optional(),
  })
  .refine((schema) => {
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
  })
