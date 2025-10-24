import { SIDE_BAR_MENU } from "@/constants/menu";

import React from "react";

import { LogOut, MonitorSmartphone } from "lucide-react";
import MenuItem from "./menu-item";
import DomainMenu from "./domain-menu";
import { MenuLogo } from "@/icons/menu-logo";

type MinMenuProps = {
    onShrink(): void;
    current: string;
    onSignOut(): void;
    domains:
    | {
        id: string;
        name: string;
        icon: string | null;
    }[]
    | null
    | undefined;
};

const MinMenu = ({ current, domains, onShrink, onSignOut }: MinMenuProps) => {
    // Verificar si hay empresa creada
    const hasCompany = Boolean(domains && domains.length > 0)

    return (
        <div className="p-3 flex flex-col items-center h-full">
            <span className="animate-fade-in opacity-0 delay-300 fill-mode-forwards cursor-pointer">
                <MenuLogo onClick={onShrink} />
            </span>
            <div className="animate-fade-in opacity-0 delay-300 fill-mode-forwards flex flex-col justify-between h-full pt-10">
                <div className="flex flex-col">
                    {SIDE_BAR_MENU
                        .filter(menu => {
                            // Verificar visibilidad para configuración
                            if (menu.path === 'settings' && !hasCompany) {
                                return false // No mostrar configuración si NO hay empresa
                            }
                            // Verificar visibilidad para inventario
                            if (menu.path === 'inventory' && !hasCompany) {
                                return false // No mostrar inventario si NO hay empresa
                            }
                            return true
                        })
                        .map((menu, key) => (
                            <MenuItem
                                size="min"
                                {...menu}
                                key={key}
                                current={current}
                            />
                        ))}
                    {/* <DomainMenu
                        min
                        domains={domains}
                    /> */}
                </div>
                <div className="flex flex-col">
                    <MenuItem
                        size="min"
                        label="Sign out"
                        icon={<LogOut />}
                        onSignOut={onSignOut}
                    />
                </div>
            </div>
        </div>
    );
};

export default MinMenu;
