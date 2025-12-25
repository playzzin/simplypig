import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { MenuItem, PopoverState, SiteKey } from "../types";
import { siteData } from "../data/siteData";
import { getMemoRouteForView, getMemoViewForPath, MEMO_MENU_TEXT } from "../../memo/constants";
import { getYtRouteForView, getYtViewForPath, YT_MENU_TEXT } from "../../youtube/constants";

interface UseAdminLayoutStateResult {
    activeSite: SiteKey;
    selectSite: (site: SiteKey) => void;
    currentSite: typeof siteData[SiteKey];
    openMenus: Record<string, boolean>;
    collapsed: boolean;
    drawerOpen: boolean;
    rightPanelOpen: boolean;
    floatingOpen: boolean;
    floatingExpanded: boolean;
    selectedView: string;
    popover: PopoverState;

    isOverlayOpen: boolean;
    isDrawerOverlay: boolean;

    toggleSidebar: () => void;
    closeOverlays: () => void;
    toggleRightPanel: () => void;
    closeRightPanel: () => void;
    toggleFloating: () => void;
    closeFloating: () => void;
    toggleFloatingExpanded: () => void;

    handleMenuClick: (item: MenuItem, hasSub: boolean, anchor: HTMLButtonElement | null) => void;
    handleSubClick: (sub: string) => void;
    closePopover: () => void;
}

const DEFAULT_POPOVER: PopoverState = {
    open: false,
    anchorId: null,
    items: [],
    top: 0,
    left: 0,
};

export const useAdminLayoutState = (): UseAdminLayoutStateResult => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeSite, setActiveSite] = useState<SiteKey>("admin");
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
    const [collapsed, setCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);
    const [floatingOpen, setFloatingOpen] = useState(false);
    const [floatingExpanded, setFloatingExpanded] = useState(false);
    const [selectedView, setSelectedView] = useState("대시보드");
    const [popover, setPopover] = useState<PopoverState>(DEFAULT_POPOVER);

    const currentSite = useMemo(() => siteData[activeSite], [activeSite]);

    // URL 직접 접근/새로고침에서도 selectedView가 맞도록 동기화
    useEffect(() => {
        const memoView = getMemoViewForPath(location.pathname);
        if (memoView) {
            setSelectedView(memoView);
            return;
        }
        const ytView = getYtViewForPath(location.pathname);
        if (ytView) setSelectedView(ytView);
    }, [location.pathname]);

    const closePopover = useCallback(() => {
        setPopover(DEFAULT_POPOVER);
    }, []);

    const togglePopover = useCallback(
        (next: PopoverState) => {
            setPopover((prev) => {
                const sameAnchor = prev.anchorId === next.anchorId;
                if (prev.open && sameAnchor) return DEFAULT_POPOVER;
                return next;
            });
        },
        []
    );

    const closeOverlays = useCallback(() => {
        setDrawerOpen(false);
        setRightPanelOpen(false);
        setFloatingOpen(false);
        setFloatingExpanded(false);
        closePopover();
    }, [closePopover]);

    const isOverlayOpen = drawerOpen || rightPanelOpen || floatingOpen;
    const isDrawerOverlay = drawerOpen && !rightPanelOpen && !floatingOpen;

    const toggleMenu = useCallback((id: string) => {
        setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const handleMenuClick = useCallback(
        (item: MenuItem, hasSub: boolean, anchor: HTMLButtonElement | null) => {
            // 라우팅: 메모장/유튜브 외 메뉴를 클릭하면 기능 라우트를 빠져나와 기존 selectedView 기반 렌더링으로 복귀
            if (item.text !== MEMO_MENU_TEXT && item.text !== YT_MENU_TEXT) {
                navigate("/");
            }

            if (collapsed) {
                if (hasSub && anchor) {
                    const rect = anchor.getBoundingClientRect();
                    togglePopover({
                        open: true,
                        anchorId: item.id,
                        items: item.sub ?? [],
                        top: rect.top,
                        left: rect.right + 8,
                    });
                } else {
                    setSelectedView(item.text);
                    closePopover();
                    setDrawerOpen(false);
                }
                return;
            }

            if (hasSub) {
                toggleMenu(item.id);
            } else {
                setSelectedView(item.text);
                setOpenMenus({});
            }
        },
        [closePopover, collapsed, navigate, toggleMenu, togglePopover]
    );

    const handleSubClick = useCallback(
        (sub: string) => {
            setSelectedView(sub);
            const memoRoute = getMemoRouteForView(sub);
            if (memoRoute) {
                navigate(memoRoute);
            } else {
                const ytRoute = getYtRouteForView(sub);
                if (ytRoute) navigate(ytRoute);
                else navigate("/");
            }
            closePopover();
            setDrawerOpen(false);
        },
        [closePopover, navigate]
    );

    const toggleSidebar = useCallback(() => {
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
        if (isDesktop) {
            const next = !collapsed;
            setCollapsed(next);
            if (next) setOpenMenus({});
            closePopover();
            setRightPanelOpen(false);
            setFloatingOpen(false);
            setFloatingExpanded(false);
            return;
        }

        setRightPanelOpen(false);
        setFloatingOpen(false);
        setFloatingExpanded(false);
        setCollapsed(false);
        closePopover();
        setDrawerOpen((prev) => !prev);
    }, [closePopover, collapsed]);

    const selectSite = useCallback(
        (site: SiteKey) => {
            setActiveSite(site);
            setSelectedView("대시보드");
            setOpenMenus({});
            closePopover();
            setRightPanelOpen(false);
        },
        [closePopover]
    );

    const toggleRightPanel = useCallback(() => {
        // 원본 UX: 한 번 더 누르면 닫힘 + 다른 레이어 정리
        closePopover();
        setFloatingOpen(false);
        setFloatingExpanded(false);
        setRightPanelOpen((prev) => !prev);
    }, [closePopover]);
    const closeRightPanel = useCallback(() => setRightPanelOpen(false), []);
    const toggleFloating = useCallback(() => {
        // 원본 UX: 한 번 더 누르면 닫힘 + 다른 레이어 정리
        closePopover();
        setRightPanelOpen(false);
        setFloatingOpen((prev) => {
            const next = !prev;
            if (!next) setFloatingExpanded(false);
            return next;
        });
    }, [closePopover]);
    const closeFloating = useCallback(() => {
        setFloatingOpen(false);
        setFloatingExpanded(false);
    }, []);
    const toggleFloatingExpanded = useCallback(() => setFloatingExpanded((prev) => !prev), []);

    useEffect(() => {
        const onResize = () => {
            const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
            if (isDesktop) {
                setDrawerOpen(false);
            } else {
                setCollapsed(false);
                closePopover();
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeOverlays();
            }
        };

        const onDocumentClick = (e: MouseEvent) => {
            // 원본 UX: 팝오버가 열린 상태에서 바깥 클릭이면 닫기
            if (!popover.open) return;
            const target = e.target as HTMLElement | null;
            if (!target) return;
            if (target.closest(".popover")) return;
            if (target.closest(".menu-btn")) return;
            closePopover();
        };

        window.addEventListener("resize", onResize);
        window.addEventListener("keydown", onKeyDown);
        document.addEventListener("click", onDocumentClick);
        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("click", onDocumentClick);
        };
    }, [closeOverlays, closePopover, popover.open]);

    return {
        activeSite,
        selectSite,
        currentSite,
        openMenus,
        collapsed,
        drawerOpen,
        rightPanelOpen,
        floatingOpen,
        floatingExpanded,
        selectedView,
        popover,
        isOverlayOpen,
        isDrawerOverlay,
        toggleSidebar,
        closeOverlays,
        toggleRightPanel,
        closeRightPanel,
        toggleFloating,
        closeFloating,
        toggleFloatingExpanded,
        handleMenuClick,
        handleSubClick,
        closePopover,
    };
};


