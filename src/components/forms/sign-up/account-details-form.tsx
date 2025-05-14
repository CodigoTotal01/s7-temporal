import { USER_REGISTRATION_FORM } from "@/constants/forms";
import React from "react";
import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";
import FormGenerator from "../form-generator";

type Props = {
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors<FieldValues>;
};

const AccountDetailForm = ({ errors, register }: Props) => {
  return (
    <>
      <h2 className="text-gravel md:text-4xl font-bold">Detalles de la Cuenta</h2>
      <p className="text-iridium md:text-sm">Ingresa tu correo electrónico y contraseña</p>
      {USER_REGISTRATION_FORM.map((field) => (
        <FormGenerator
          key={field.id}
          {...field}
          errors={errors}
          register={register}
          name={field.name}
        />
      ))}
    </>
  );
};

export default AccountDetailForm;
