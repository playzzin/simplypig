import { useEffect, useMemo, useRef, useState } from "react";
import type { FloatingLayerPosition } from "../types";

interface UseFloatingLayerDragParams {
    isOpen: boolean;
    isExpanded: boolean;
}

interface UseFloatingLayerDragResult {
    position: FloatingLayerPosition | null;
    setPosition: (pos: FloatingLayerPosition | null) => void;
    handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    layerStyle: React.CSSProperties | undefined;
    clampIntoViewport: () => void;
}

type DragState = {
    active: boolean;
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
    rafId: number | null;
    nextLeft: number;
    nextTop: number;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const useFloatingLayerDrag = ({ isOpen, isExpanded }: UseFloatingLayerDragParams): UseFloatingLayerDragResult => {
    const [position, setPosition] = useState<FloatingLayerPosition | null>(null);
    const layerRef = useRef<HTMLElement | null>(null);
    const dragRef = useRef<DragState>({
        active: false,
        startX: 0,
        startY: 0,
        originLeft: 0,
        originTop: 0,
        rafId: null,
        nextLeft: 0,
        nextTop: 0,
    });

    const applyPosition = () => {
        dragRef.current.rafId = null;
        const nextLeft = dragRef.current.nextLeft;
        const nextTop = dragRef.current.nextTop;
        setPosition({ left: nextLeft, top: nextTop });
    };

    const stopDrag = () => {
        dragRef.current.active = false;
        if (dragRef.current.rafId) {
            cancelAnimationFrame(dragRef.current.rafId);
            dragRef.current.rafId = null;
        }
    };

    const clampIntoViewport = () => {
        const el = layerRef.current;
        if (!el || !isOpen) return;
        const rect = el.getBoundingClientRect();
        const maxLeft = window.innerWidth - rect.width - 8;
        const maxTop = window.innerHeight - rect.height - 8;
        const nextLeft = clamp(rect.left, 8, Math.max(8, maxLeft));
        const nextTop = clamp(rect.top, 8, Math.max(8, maxTop));
        setPosition({ left: nextLeft, top: nextTop });
    };

    const onPointerMove = (e: PointerEvent) => {
        if (!dragRef.current.active || !layerRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;

        const rect = layerRef.current.getBoundingClientRect();
        const maxLeft = window.innerWidth - rect.width - 8;
        const maxTop = window.innerHeight - rect.height - 8;

        dragRef.current.nextLeft = clamp(dragRef.current.originLeft + dx, 8, Math.max(8, maxLeft));
        dragRef.current.nextTop = clamp(dragRef.current.originTop + dy, 8, Math.max(8, maxTop));

        if (!dragRef.current.rafId) {
            dragRef.current.rafId = requestAnimationFrame(applyPosition);
        }
    };

    const onPointerUp = () => stopDrag();

    useEffect(() => {
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        // 레이어가 열릴 때 viewport 내부로 보정
        const t = window.setTimeout(() => clampIntoViewport(), 0);
        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, isExpanded]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!layerRef.current) {
            const maybeLayer = (e.currentTarget.closest(".floating-layer") as HTMLElement | null) ?? null;
            layerRef.current = maybeLayer;
        }
        if (!layerRef.current) return;

        // 원본 동작: 헤더 내부 버튼(닫기/확장) 클릭에서는 드래그 시작 금지
        const target = e.target as HTMLElement | null;
        if (target?.closest?.(".btn-icon")) return;

        // primary button만
        if (typeof e.button === "number" && e.button !== 0) return;

        dragRef.current.active = true;
        dragRef.current.startX = e.clientX;
        dragRef.current.startY = e.clientY;

        const rect = layerRef.current.getBoundingClientRect();
        dragRef.current.originLeft = rect.left;
        dragRef.current.originTop = rect.top;

        // 현재 위치를 left/top 기준으로 고정(드래그 중 안정성)
        setPosition({ left: rect.left, top: rect.top });

        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            // no-op
        }
    };

    const layerStyle = useMemo<React.CSSProperties | undefined>(() => {
        // 닫힌 상태에서는 CSS(right:-420px 등)가 정상 적용되도록 inline positioning 제거
        if (!isOpen) return undefined;
        if (!position) return undefined;
        return {
            left: position.left,
            top: position.top,
            right: "auto",
        };
    }, [isOpen, position]);

    return { position, setPosition, handlePointerDown, layerStyle, clampIntoViewport };
};


