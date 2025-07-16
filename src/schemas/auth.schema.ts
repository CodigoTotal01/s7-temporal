import { z, ZodType } from "zod";

export type UserRegistrationProps = {
  type: string;
  fullname: string;
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  otp: string;
};

export const UserRegistrationSchema = z
  .object({
    type: z.string().min(1),
    fullname: z
      .string()
      .min(4, { message: "Tu nombre completo debe tener al menos 4 caracteres" }),
    email: z.string().email({ message: "Formato de email incorrecto" }),
    confirmEmail: z.string().email(),
    password: z
      .string()
      .min(8, { message: "Tu contraseña debe tener al menos 8 caracteres" })
      .max(64, {
        message: "Tu contraseña no puede ser mayor a 64 caracteres",
      })
      .refine(
        (value) => /^[a-zA-Z0-9_.-]*$/.test(value ?? ""),
        "Tu contraseña debe contener solo letras y números",
      ),
    confirmPassword: z.string(),
    otp: z.string().min(6, { message: "Debes ingresar un código de 6 dígitos" }),
  })
  .required()
  .refine((schema) => schema.password === schema.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((schema) => schema.email === schema.confirmEmail, {
    message: "Tus emails no coinciden",
    path: ["confirmEmail"],
  });

export type UserLoginProps = {
  email: string;
  password: string;
};

export type ChangePasswordProps = {
  password: string;
  confirmPassword: string;
};

export const UserLoginSchema = z.object({
  email: z.string().email({ message: "No ingresaste un email válido" }),
  password: z
    .string()
    .min(8, { message: "Tu contraseña debe tener al menos 8 caracteres" })
    .max(64, { message: "Tu contraseña no puede ser mayor a 64 caracteres" }),
});

export const ChangePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Tu contraseña debe tener al menos 8 caracteres' })
      .max(64, {
        message: 'Tu contraseña no puede ser mayor a 64 caracteres',
      })
      .refine(
        (value) => /^[a-zA-Z0-9_.-]*$/.test(value ?? ''),
        'password should contain only alphabets and numbers'
      ),
    confirmPassword: z.string(),
  })
  .required()
  .refine((schema) => schema.password === schema.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
