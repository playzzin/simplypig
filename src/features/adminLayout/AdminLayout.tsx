import { Toaster } from "sonner";
import useSound from "use-sound";
import "sonner/dist/styles.css";
import "../../App.css";

import { siteData } from "./data/siteData";
import { useAdminLayoutState } from "./hooks/useAdminLayoutState";
import { Sidebar } from "./components/Sidebar";
import { Overlay } from "./components/Overlay";
import { Header } from "./components/Header";
import { RightPanel } from "./components/RightPanel";
import { FloatingLayer } from "./components/FloatingLayer";
import { Popover } from "./components/Popover";
import { MainContent } from "./components/MainContent";
import { useEnsureAnonymousAuth } from "../../hooks/useEnsureAnonymousAuth";

export const AdminLayout = () => {
    const authState = useEnsureAnonymousAuth();
    const soundUrl = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";
    const [playNotify] = useSound(soundUrl, {
        volume: 0.4,
    });
    const playNotifySafe = () => {
        try {
            playNotify();
        } catch (e) {
            // ignore
        }
        try {
            const audio = new Audio(soundUrl);
            audio.volume = 0.4;
            void audio.play();
        } catch (e) {
            // ignore
        }
    };

    const {
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
    } = useAdminLayoutState();

    const popoverTitle = siteData[activeSite].menu.find((m) => m.id === popover.anchorId)?.text ?? "";

    return (
        <>
            <div className="relative flex min-h-screen text-slate-100">
                <Sidebar
                    collapsed={collapsed}
                    drawerOpen={drawerOpen}
                    openMenus={openMenus}
                    site={currentSite}
                    selectedView={selectedView}
                    onMenuClick={handleMenuClick}
                    onSubClick={handleSubClick}
                />

                <Overlay isOpen={isOverlayOpen} isDrawer={isDrawerOverlay} onClick={closeOverlays} />

                <div className="main-wrapper">
                    <Header onToggleSidebar={toggleSidebar} onToggleRightPanel={toggleRightPanel} onToggleFloating={toggleFloating} />
                    <MainContent selectedView={selectedView} uid={authState.uid} authError={authState.error} />
                </div>

                <RightPanel
                    isOpen={rightPanelOpen}
                    activeSite={activeSite}
                    onSelectSite={selectSite}
                    onClose={closeRightPanel}
                    onPlaySound={playNotifySafe}
                />

                <FloatingLayer
                    isOpen={floatingOpen}
                    isExpanded={floatingExpanded}
                    uid={authState.uid}
                    onClose={closeFloating}
                    onToggleExpanded={toggleFloatingExpanded}
                />

                <Popover
                    isOpen={popover.open}
                    top={popover.top}
                    left={popover.left}
                    title={popoverTitle}
                    items={popover.items}
                    onSelect={handleSubClick}
                    onClose={closePopover}
                />
            </div>
            {/* 알림: 헤더 바로 아래 표시 */}
            <Toaster position="top-right" richColors offset={64} toastOptions={{ className: "toast-compact" }} />
        </>
    );
};


