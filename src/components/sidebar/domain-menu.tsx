import { useDomain } from "@/hooks/sidebar/use-domain";
import { cn } from "@/lib/utils";
import AppDrawer from "../drawer";
import { Loader } from "../loader";
import FormGenerator from "../forms/form-generator";
import UploadButton from "../upload-button";
import { Button } from "../ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import Image from "next/image";

type Props = {
    min?: boolean;
    domains: {
        id: string;
        name: string;
        icon: string | null;
    }[] | null | undefined;
};

const DomainMenu = ({ domains, min }: Props) => {
    const { register, onAddDomain, loading, errors, isDomain } = useDomain()

    return (
        <div className={cn('flex flex-col gap-3 w-full', min ? 'mt-6' : 'mt-3')}>
            <div className="flex justify-between w-full items-center">
                {!min && <p className="text-xs text-gray-500">EMPRESAS</p>}
                <AppDrawer
                    description="Añade tu empresa para integrar tu chatbot"
                    title="Añade tu empresa"
                    onOpen={
                        <div className="cursor-pointer text-gray-500 rounded-full border-2 w-9 h-9 flex items-center justify-center ml-auto">
                            <Plus />
                        </div>
                    }>
                    <Loader loading={loading}>
                        <form
                            className="mt-3 w-6/12 flex flex-col gap-3"
                            onSubmit={onAddDomain}>
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
                                label="Subir Icono"
                                errors={errors}
                            />
                            <Button
                                type="submit"
                                className="w-full">
                                Añadir Empresa
                            </Button>
                        </form>
                    </Loader>
                </AppDrawer>
            </div>
            <div className="flex flex-col gap-1 text-ironside font-medium">
                {domains && domains.map((domain) => (
                    <Link
                        href={`/settings/${encodeURIComponent(domain.name)}`}
                        key={domain.id}
                        className={cn(
                            'flex gap-3 items-center justify-center hover:bg-white rounded-lg transition duration-100 ease-in-out cursor-pointer',
                            !min ? 'p-2' : 'py-2',
                            domain.name == isDomain && 'bg-white'
                        )}>
                        <Image
                            src={`https://ucarecdn.com/${domain.icon}/`}
                            alt="logo"
                            width={20}
                            height={20}
                        />
                        {!min && <p className="text-sm">{domain.name}</p>}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default DomainMenu;