import { HeartHandshake, LayoutDashboard, Mail, MessageCircleMore, MessageSquareMore, Settings, Settings2, SquareUser, StarIcon, TimerIcon, FolderKanban } from "lucide-react";

type SIDE_BAR_MENU_PROPS = {
    label: string;
    icon: JSX.Element;
    path: string;
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
    /* {
        label: 'Integraciones',
        icon: <Settings2 />,
        path: 'integration',
    }, */
    {
        label: 'Configuraciones',
        icon: <Settings />,
        path: 'settings',
    },
    {
        label: 'Catálogos',
        icon: <FolderKanban />,
        path: 'catalogs',
    },
    {
        label: 'Citas',
        icon: <SquareUser />,
        path: 'appointment',
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
        label: 'chatbot',
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