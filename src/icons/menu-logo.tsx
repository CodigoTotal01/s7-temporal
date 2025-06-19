import { Menu } from "lucide-react";

type MenuLogoProps = {
    onClick(): void;
};

const MenuLogo = ({ onClick }: MenuLogoProps) => {
    return (
        <button
            onClick={onClick}
            className="flex p-2 rounded-md hover:bg-gray-300 transition-colors"
            aria-label="Open menu"
        >
            <Menu className="w-6 h-6" />
        </button>
    );
};

export default MenuLogo;