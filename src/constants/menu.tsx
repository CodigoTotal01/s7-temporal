import { HeartHandshake, LayoutDashboard, Mail, MessageCircleMore, MessageSquareMore, Settings, Settings2, SquareUser, StarIcon, TimerIcon} from "lucide-react";

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
        label: 'Conversations',
        icon: <MessageSquareMore />,
        path: 'conversation',
    },
    {
        label: 'Integrations',
        icon: <Settings2 />,
        path: 'integration',
    },
    {
        label: 'Settings',
        icon: <Settings />,
        path: 'settings',
    },
   /*  {
        label: 'Appointments',
        icon: <SquareUser />,
        path: 'appointment',
    }, */
   /*  {
        label: 'Email Marketing',
        icon: <Mail />,
        path: 'email-marketing'
    } */
]

type TABS_MENU_PROPS = {
    label: string
    icon?: JSX.Element
}

export const TABS_MENU: TABS_MENU_PROPS[] = [
    {
        label: 'unread',
        icon: <Mail />
    },
    {
        label: 'all',
        icon: <Mail />
    },
    {
        label: 'expired',
        icon: <TimerIcon/>
    },
    {
        label: 'starred',
        icon: <StarIcon />
    }
]

export const HELP_DESK_TABS_MENU: TABS_MENU_PROPS[] = [
{
    label: 'help desk',

}, {
    label: 'questions',
}
]


export const APPOINTMENT_TABLE_HEADER = [
    'Name',
    'RequestedTime',
    'Added Time',
    'Domain',
]

export const   EMAIL_MARKETING_HEADER = [
    'Id',
    'Email',
    'Answers',
    'Domain',
]

export const BOT_TABS_MENU: TABS_MENU_PROPS[] = [
        {
            label: 'chat',
            icon: <MessageCircleMore />
        },
        {
            label: 'helpdesk',
            icon: <HeartHandshake />
        }
]