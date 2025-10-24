import { HeartHandshake, LayoutDashboard, Mail, MessageCircleMore, MessageSquareMore, Settings, Settings2, SquareUser, StarIcon, TimerIcon, FolderKanban, Package, Clock } from "lucide-react";

type SIDE_BAR_MENU_PROPS = {
    label: string;
    icon: JSX.Element;
    path: string;
    isSubmenu?: boolean;
    parentPath?: string;
};

export const SIDE_BAR_MENU: SIDE_BAR_MENU_PROPS[] = [
    {
        label: 'Dashboard',
        icon: <LayoutDashboard />,
        path: 'dashboard',
    },
    {
        label: 'Conversaciones',
        icon: <MessageSquareMore />,
        path: 'conversation',
    },
    {
        label: 'Citas',
        icon: <SquareUser />,
        path: 'appointment',
    },
    {
        label: 'Inventario',
        icon: <Package />,
        path: 'inventory',
        isSubmenu: true,
    },
    {
        label: 'Productos',
        icon: <Package />,
        path: 'products',
        parentPath: 'inventory',
    },
    {
        label: 'Catálogos',
        icon: <FolderKanban />,
        path: 'catalogs',
        parentPath: 'inventory',
    },
    {
        label: 'Configuración',
        icon: <Settings />,
        path: 'settings',
        isSubmenu: true,
    },
    {
        label: 'Mi Cuenta',
        icon: <Settings />,
        path: 'account',
        parentPath: 'settings',
    },
    {
        label: 'Mi Empresa',
        icon: <Settings2 />,
        path: 'company',
        parentPath: 'settings',
    },
    {
        label: 'Asistente Virtual',
        icon: <MessageCircleMore />,
        path: 'chatbot-config',
        parentPath: 'settings',
    },
    {
        label: 'Horarios',
        icon: <Clock />,
        path: 'schedule',
        parentPath: 'settings',
    },
]

type TABS_MENU_PROPS = {
    label: string
    icon?: JSX.Element
}

export const TABS_MENU: TABS_MENU_PROPS[] = [
    {
        label: 'no leidos',
        icon: <Mail />
    },
    {
        label: 'todos',
        icon: <Mail />
    },
    {
        label: 'expirados',
        icon: <TimerIcon />
    },
    {
        label: 'favoritos',
        icon: <StarIcon />
    }
]

export const HELP_DESK_TABS_MENU: TABS_MENU_PROPS[] = [
    {
        label: 'soporte',

    }, {
        label: 'preguntas',
    }
]


export const APPOINTMENT_TABLE_HEADER = [
    'Nombre',
    'Hora solicitada',
    'Hora añadida',
    'Empresa',
]

export const BOT_TABS_MENU: TABS_MENU_PROPS[] = [
    {
        label: 'asistente',
        icon: <MessageCircleMore />
    },
    {
        label: 'soporte',
        icon: <HeartHandshake />
    }
]

export const CATALOG_TABS_MENU: TABS_MENU_PROPS[] = [
    {
        label: 'categorías',
    },
    {
        label: 'materiales',
    },
    {
        label: 'texturas',
    },
    {
        label: 'temporadas',
    },
    {
        label: 'usos',
    },
    {
        label: 'características',
    }
]