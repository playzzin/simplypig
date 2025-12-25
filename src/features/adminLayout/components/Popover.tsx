import { MoreVertical } from "lucide-react";

interface PopoverProps {
    isOpen: boolean;
    top: number;
    left: number;
    title: string;
    items: string[];
    onSelect: (item: string) => void;
    onClose: () => void;
}

export const Popover: React.FC<PopoverProps> = ({ isOpen, top, left, title, items, onSelect, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="popover" style={{ top, left }} onMouseLeave={onClose}>
            <div className="popover-header">
                <MoreVertical size={14} />
                <span>{title}</span>
            </div>
            <div className="popover-list">
                {items.map((sub) => (
                    <button key={sub} className="popover-item" type="button" onClick={() => onSelect(sub)}>
                        {sub}
                    </button>
                ))}
            </div>
        </div>
    );
};


