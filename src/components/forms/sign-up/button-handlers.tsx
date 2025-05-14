"use client";

import { Button } from "@/components/ui/button";
import { useAuthContextHook } from "@/context/use-auth-context";
import { useSignUpForm } from "@/hooks/sign-up/use-sign-up";
import Link from "next/link";
import React from "react";
import { useFormContext } from "react-hook-form";

const SignInLink = () => (
  <p>
    Ya tienes una cuenta?{" "}
    <Link href="/auth/sign-in" className="font-bold">
      Ingresar
    </Link>
  </p>
);

const ButtonHandler = () => {
  const { currentStep, setCurrentStep } = useAuthContextHook();
  const { formState, getFieldState, getValues } = useFormContext();
  const { onGenerateOTP } = useSignUpForm();

  const { isDirty: isName } = getFieldState("fullname", formState);
  const { isDirty: isEmail } = getFieldState("email", formState);
  const { isDirty: isPassword } = getFieldState("password", formState);

  if (currentStep === 2) {
    return (
      <div className="w-full flex flex-col gap-3 items-center">
        <Button
          type="submit"
          className="w-full"
          {...(isName &&
            isEmail &&
            isPassword && {
              onClick: () => {
                onGenerateOTP(
                  getValues("email"),
                  getValues("password"),
                  setCurrentStep,
                );
              },
            })}
        >
          Continuar
        </Button>
        <SignInLink />
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="w-full flex flex-col gap-3 items-center">
        <Button type="submit" className="w-full">
          Crea una cuenta
        </Button>
        <SignInLink />
      </div>
    );
  }

  return (
    <div>
      <Button
        type="submit"
        className="w-full"
        onClick={() => setCurrentStep((prev: number) => prev + 1)}
      >
        Continuar
      </Button>

      <SignInLink />
    </div>
  );
};

export default ButtonHandler;
