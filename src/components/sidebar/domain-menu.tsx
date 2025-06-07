type Props = {
    min?: boolean;
    domains: {
        id: string;
        name: string;
        icon: string | null;
    }[] | null | undefined;
};

const DomainMenu = ({domains, min}: Props) => {
    return <div>DomainMenu</div>;
};

export default DomainMenu;