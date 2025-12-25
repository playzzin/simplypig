import type { ReactNode } from "react";
import { Activity, AppWindow, Cloud, LayoutGrid, Layers, ShieldCheck, StickyNote, Users, Youtube } from "lucide-react";
import type { SiteConfig, SiteKey, Stat } from "../types";

function ShoppingCartIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path
                stroke="currentColor"
                strokeWidth="1.8"
                d="M6 6h15l-1.5 9h-11zM6 6l-1-3H3M9 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
            />
        </svg>
    );
}

export const siteData: Record<SiteKey, SiteConfig> = {
    admin: {
        name: "Admin",
        icon: <ShieldCheck size={18} />,
        menu: [
            { id: "dash", text: "대시보드", icon: <LayoutGrid size={18} />, sub: [] },
            {
                id: "memo",
                text: "메모장",
                icon: <StickyNote size={18} />,
                sub: ["메모 목록", "새 메모", "카테고리 설정"],
            },
            {
                id: "yt",
                text: "유튜브",
                icon: <Youtube size={18} />,
                sub: ["유튜브 라이브러리", "유튜브 추가", "유튜브 카테고리", "유튜브 큐"],
            },
            { id: "console-lib", text: "콘솔 라이브러리", icon: <Cloud size={18} />, sub: [] },
        ],
    },
    corp: {
        name: "Corporate",
        icon: <Users size={18} />,
        menu: [
            {
                id: "info",
                text: "회사소개",
                icon: <AppWindow size={18} />,
                sub: ["인사말", "연혁", "조직도"],
            },
            { id: "notice", text: "공지사항", icon: <Activity size={18} />, sub: [] },
        ],
    },
    media: {
        name: "Media",
        icon: <Layers size={18} />,
        menu: [{ id: "video", text: "영상관리", icon: <Cloud size={18} />, sub: ["최신영상", "아카이브"] }],
    },
    shop: {
        name: "Shop",
        icon: <ShoppingCartIcon />,
        menu: [{ id: "order", text: "주문관리", icon: <AppWindow size={18} />, sub: ["주문내역", "배송관리"] }],
    },
};

export const stats: Stat[] = [
    { label: "신규 데이터 등록", value: "124 건", tag: "12.5% 증가", tone: "success" },
    { label: "처리 대기 리스트", value: "8 건", tag: "즉시 확인", tone: "warning" },
    { label: "시스템 가동률", value: "99.9%", tag: "정상 작동", tone: "info" },
];

export const getStatsToneClass = (tone?: Stat["tone"]): string => {
    if (tone === "success") return "border-emerald-500/40 bg-emerald-500/5 text-emerald-100";
    if (tone === "warning") return "border-amber-400/40 bg-amber-500/5 text-amber-100";
    return "border-cyan-400/30 bg-cyan-500/5 text-cyan-100";
};

export const getSiteEntries = (): Array<{ key: SiteKey; name: string; icon: ReactNode }> => {
    return (Object.keys(siteData) as SiteKey[]).map((key) => ({
        key,
        name: siteData[key].name,
        icon: siteData[key].icon,
    }));
};


