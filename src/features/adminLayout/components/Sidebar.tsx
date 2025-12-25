import { ArrowRight } from "lucide-react";
import type { MenuItem, SiteConfig } from "../types";

interface SidebarProps {
    collapsed: boolean;
    drawerOpen: boolean;
    openMenus: Record<string, boolean>;
    site: SiteConfig;
    selectedView?: string;
    onMenuClick: (item: MenuItem, hasSub: boolean, anchor: HTMLButtonElement | null) => void;
    onSubClick: (sub: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    collapsed,
    drawerOpen,
    openMenus,
    site,
    selectedView,
    onMenuClick,
    onSubClick,
}) => {
    return (
        <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${drawerOpen ? "drawer-open" : ""}`}>
            <div className="sidebar-header">
                <div className="logo-box">S</div>
                {!collapsed && <span className="logo-text">Admin Suite</span>}
            </div>
            <nav className="menu-nav">
                <ul>
                    {site.menu.map((item) => {
                        const hasSub = !!item.sub?.length;
                        const isOpen = !!openMenus[item.id];
                        const isItemActive =
                            selectedView === item.text || (item.sub?.includes(selectedView ?? "") ?? false);
                        return (
                            <li key={item.id} className={`menu-item ${isOpen ? "open" : ""} ${isItemActive ? "active" : ""}`}>
                                <button
                                    className="menu-btn"
                                    onClick={(e) => onMenuClick(item, hasSub, e.currentTarget)}
                                    type="button"
                                >
                                    <span className="menu-icon">{item.icon}</span>
                                    {!collapsed && <span className="menu-label">{item.text}</span>}
                                    {!collapsed && hasSub && (
                                        <span className="arrow">
                                            <ArrowRight size={14} />
                                        </span>
                                    )}
                                </button>
                                {!collapsed && hasSub && (
                                    <div className={`submenu ${isOpen ? "open" : ""}`}>
                                        {item.sub!.map((sub) => (
                                            <button
                                                key={sub}
                                                className={`submenu-link ${selectedView === sub ? "active" : ""}`}
                                                type="button"
                                                onClick={() => onSubClick(sub)}
                                            >
                                                <span className="dot" />
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};


