import type { ReactNode } from "react";

export interface MenuItem {
    id: string;
    text: string;
    icon: ReactNode;
    sub?: string[];
}

export interface SiteConfig {
    name: string;
    icon: ReactNode;
    menu: MenuItem[];
}

export type SiteKey = "admin" | "corp" | "media" | "shop";

export interface Stat {
    label: string;
    value: string;
    tag: string;
    tone?: "success" | "warning" | "info";
}

export interface PopoverState {
    open: boolean;
    anchorId: string | null;
    items: string[];
    top: number;
    left: number;
}

export interface FloatingLayerPosition {
    left: number;
    top: number;
}


