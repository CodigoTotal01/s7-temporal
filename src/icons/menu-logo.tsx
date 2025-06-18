import { Menu } from "lucide-react";
import Image from "next/image";

type MenuLogoProps = {
    onClick(): void;
};

const MenuLogo = ({ onClick }: MenuLogoProps) => {
    return (
        <button
            onClick={onClick}
            className="flex justify-center p-2 rounded-md hover:bg-gray-300 transition-colors"
            aria-label="Open menu"
        >
            <Image
                src="/images/logo-short.png"
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
        </button>
    );
};

export default MenuLogo;