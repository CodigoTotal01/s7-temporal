"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDomain } from "@/hooks/sidebar/use-domain";
import FormGenerator from "@/components/forms/form-generator";
import UploadButton from "@/components/upload-button";
import { Button } from "@/components/ui/button";
import AppDrawer from "@/components/drawer";
import { Loader } from "@/components/loader";
import { Plus } from "lucide-react";

type DomainRequiredGuardProps = {
    children: React.ReactNode;
    domains: {
        id: string;
        name: string;
        icon: string;
    }[] | null | undefined;
};

export default function DomainRequiredGuard({ children, domains }: DomainRequiredGuardProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { register, onAddDomain, loading, errors, reset } = useDomain();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const hasDomains = domains && domains.length > 0;

    // Si no tiene dominios, mostrar el formulario de crear dominio
    if (!hasDomains) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full space-y-8 p-8">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 text-blue-600 mb-4">
                            <Plus className="h-12 w-12" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            Crear tu Empresa
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Para comenzar a usar la plataforma, necesitas crear una empresa
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <form
                            className="flex flex-col gap-4"
                            onSubmit={async (e) => {
                                await onAddDomain(e);
                                // No cerrar el drawer aquí, se maneja en el hook
                            }}
                        >
                            <FormGenerator
                                inputType="input"
                                register={register}
                                label="Nombre de la empresa"
                                name="domain"
                                errors={errors}
                                placeholder="Mi Empresa"
                                type="text"
                            />

                            <UploadButton
                                register={register}
                                errors={errors}
                                label="Logo de la empresa"
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? "Creando empresa..." : "Crear Empresa"}
                            </Button>
                        </form>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            Una vez creada tu empresa, podrás acceder a todas las funcionalidades
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Si tiene dominios, mostrar el contenido normal
    return <>{children}</>;
}
