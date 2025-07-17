import React from "react";
import { FieldValues, UseFormRegister } from "react-hook-form";
import UserTypeCard from "./user-type-card";

type Props = {
  register: UseFormRegister<FieldValues>;
  userType: "owner" | "student";
  setUserType: React.Dispatch<React.SetStateAction<"owner" | "student">>;
};

const TypeSelectionForm = ({ register, userType, setUserType }: Props) => {
  return (
    <>
      <h2 className="text-gravel md:text-4xl font-bold">Crea una cuenta</h2>
      <p className="text-iridium md:text-sm">
        ¡Cuéntanos sobre ti! ¿A qué te dedicas? Vamos a personalizar tu
        <br />
        experiencia para que se adapte mejor a ti.
      </p>
      <UserTypeCard
        register={register}
        setUserType={setUserType}
        userType={userType}
        value="owner"
        title="Soy dueño de un negocio"
        text="Configurando mi cuenta para la empresa."
      />
    </>
  );
};

export default TypeSelectionForm;
