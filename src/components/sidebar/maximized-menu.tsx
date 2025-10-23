import { SIDE_BAR_MENU } from "@/constants/menu";
import { LogOut, Menu, MonitorSmartphone } from "lucide-react";
import React from "react";
import DomainMenu from "./domain-menu";
import MenuItem from "./menu-item";
import Image from "next/image";

type Props = {
  onExpand(): void;
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

const MaxMenu = ({ current, domains, onExpand, onSignOut }: Props) => {
  // Verificar si hay empresa creada
  const hasCompany = Boolean(domains && domains.length > 0)

  // Función para renderizar los elementos del menú con estructura jerárquica
  const renderMenuItems = () => {
    const mainMenus = SIDE_BAR_MENU.filter(menu => !menu.parentPath)
    const subMenus = SIDE_BAR_MENU.filter(menu => menu.parentPath)

    return mainMenus
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
      .map((menu, key) => {
        if (menu.isSubmenu) {
          const children = subMenus.filter(submenu => submenu.parentPath === menu.path)
          return (
            <MenuItem
              size="max"
              {...menu}
              key={key}
              current={current}
              hasCompany={hasCompany}
              isSubmenu={true}
              children={children.map((child, childKey) => (
                <MenuItem
                  size="max"
                  {...child}
                  key={childKey}
                  current={current}
                  hasCompany={hasCompany}
                />
              ))}
            />
          )
        } else {
          return (
            <MenuItem
              size="max"
              {...menu}
              key={key}
              current={current}
              hasCompany={hasCompany}
            />
          )
        }
      })
  }

  return (
    <div className="py-3 px-4 flex flex-col h-full">
      <div className="flex justify-between items-center max-h-12">
        <Image
          src="/images/logo.png"
          alt="LOGO"
          sizes="100vw"
          className="animate-fade-in opacity-0 delay-300 fill-mode-forwards"
          style={{
            width: "90%",
            height: "auto",
          }}
          width={0}
          height={0}
        />
        <Menu
          className="cursor-pointer animate-fade-in opacity-0 delay-300 fill-mode-forwards"
          onClick={onExpand} />
      </div>
      <div
        className="animate-fade-in opacity-0 delay-300 fill-mode-forwards flex flex-col justify-between h-full pt-5">

        <div className="flex flex-col">
          {renderMenuItems()}
          {/* <DomainMenu domains={domains} /> */}
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 mb-3">OPTIONS</p>
          <MenuItem
            size="max"
            label="Sign out"
            icon={<LogOut />}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </div>
  );
};

export default MaxMenu;
