interface OverlayProps {
    isOpen: boolean;
    isDrawer: boolean;
    onClick: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ isOpen, isDrawer, onClick }) => {
    return <div className={`overlay ${isOpen ? "open" : ""} ${isDrawer ? "drawer" : ""}`} onClick={onClick} />;
};


