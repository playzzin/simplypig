import { X } from "lucide-react";
import { toast } from "sonner";
import { siteData, getSiteEntries } from "../data/siteData";
import type { SiteKey } from "../types";

interface RightPanelProps {
    isOpen: boolean;
    activeSite: SiteKey;
    onSelectSite: (site: SiteKey) => void;
    onClose: () => void;
    onPlaySound?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ isOpen, activeSite, onSelectSite, onClose, onPlaySound }) => {
    return (
        <aside className={`side-panel ${isOpen ? "open" : ""}`}>
            <div className="panel-header">
                <h3>사이트 모드 전환</h3>
                <button className="btn-icon" onClick={onClose} aria-label="닫기" type="button">
                    <X size={16} />
                </button>
            </div>
            <div className="panel-content">
                <div className="site-grid">
                    {getSiteEntries().map((entry) => (
                        <button
                            key={entry.key}
                            className={`site-card ${activeSite === entry.key ? "active" : ""}`}
                            type="button"
                            onClick={() => {
                                onSelectSite(entry.key);
                                toast.success(`${siteData[entry.key].name} 모드`, { description: "메뉴가 전환되었습니다." });
                                onPlaySound?.();
                                onClose();
                            }}
                        >
                            <div className="text-2xl">{entry.icon}</div>
                            <span>{entry.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
};


