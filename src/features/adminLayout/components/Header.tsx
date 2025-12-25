import { AlignLeft, AppWindow, Layers } from "lucide-react";

interface HeaderProps {
    onToggleSidebar: () => void;
    onToggleRightPanel: () => void;
    onToggleFloating: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onToggleRightPanel, onToggleFloating }) => {
    return (
        <header className="main-header">
            <div className="flex items-center gap-2">
                <button className="btn-icon" aria-label="사이드바 토글" onClick={onToggleSidebar} type="button">
                    <AlignLeft size={18} />
                </button>
            </div>
            <div className="flex items-center gap-2">
                <button className="btn-icon" onClick={onToggleRightPanel} title="사이트 모드" type="button">
                    <Layers size={18} />
                </button>
                <button className="btn-icon" onClick={onToggleFloating} title="플로팅 레이어" type="button">
                    <AppWindow size={18} />
                </button>
            </div>
        </header>
    );
};


