import { AppWindow, Maximize2, Minimize2, Save, Settings, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFloatingLayerDrag } from "../hooks/useFloatingLayerDrag";
import { MEMO_ROUTES } from "../../memo/constants";
import { useFloatingStickerMemo } from "../../memo/hooks/useFloatingStickerMemo";

interface FloatingLayerProps {
    isOpen: boolean;
    isExpanded: boolean;
    uid: string | null;
    onClose: () => void;
    onToggleExpanded: () => void;
}

export const FloatingLayer: React.FC<FloatingLayerProps> = ({ isOpen, isExpanded, uid, onClose, onToggleExpanded }) => {
    const navigate = useNavigate();
    const { handlePointerDown, layerStyle, clampIntoViewport } = useFloatingLayerDrag({
        isOpen,
        isExpanded,
    });
    const sticker = useFloatingStickerMemo({ uid, onAfterSave: onClose });

    return (
        <aside
            className={`floating-layer ${isOpen ? "open" : ""} ${isExpanded ? "expanded" : ""}`}
            aria-hidden={!isOpen}
            style={layerStyle}
        >
            <div className="floating-layer-header" onPointerDown={handlePointerDown} role="button" aria-label="드래그로 이동">
                <div className="floating-layer-title">
                    <AppWindow size={14} />
                    <span>스티커 메모</span>
                </div>
                <div className="floating-actions">
                    <div className="floating-category-strip" onPointerDown={(e) => e.stopPropagation()}>
                        {sticker.categories.length === 0 ? (
                            <button
                                type="button"
                                className="btn-icon btn-icon-sm"
                                aria-label="카테고리 설정으로 이동"
                                onClick={() => navigate(MEMO_ROUTES.categories)}
                            >
                                <Settings size={14} />
                            </button>
                        ) : (
                            sticker.categories.map((c) => {
                                const isSelected = c.id === sticker.selectedCategoryId;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        className={`floating-category-dot ${isSelected ? "selected" : ""}`}
                                        style={{ background: c.colorHex }}
                                        aria-label={`카테고리 선택: ${c.name}`}
                                        onClick={() => sticker.setSelectedCategoryId(c.id)}
                                    >
                                        <span className="sr-only">{c.name}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <button
                        className="btn-icon btn-icon-sm"
                        type="button"
                        aria-label={isExpanded ? "축소" : "확장"}
                        onPointerDown={(e) => {
                            // 원본 UX: 버튼 영역은 드래그 핸들에서 제외
                            e.stopPropagation();
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpanded();
                            // 확장/축소 후 뷰포트 보정
                            window.setTimeout(() => clampIntoViewport(), 0);
                        }}
                    >
                        {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button
                        className="btn-icon btn-icon-sm"
                        type="button"
                        aria-label="닫기"
                        onPointerDown={(e) => {
                            // 원본 UX: 버튼 영역은 드래그 핸들에서 제외
                            e.stopPropagation();
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
            <div className="floating-layer-body">
                <textarea
                    className="floating-sticker-input"
                    value={sticker.content}
                    onChange={(e) => sticker.setContent(e.target.value)}
                    placeholder={"첫 줄이 제목으로 저장됩니다.\n\n예)\n오늘 할 일\n- 운동 30분\n- 장보기"}
                    disabled={!uid}
                />
            </div>
            <div className="floating-layer-footer" onPointerDown={(e) => e.stopPropagation()}>
                <div className="floating-footer-left">
                    {sticker.selectedCategoryColorHex && <span className="floating-footer-dot" style={{ background: sticker.selectedCategoryColorHex }} aria-hidden />}
                    <span className="floating-footer-hint">{sticker.derivedTitle.length > 0 ? sticker.derivedTitle : "메모"}</span>
                </div>
                <button
                    type="button"
                    className="floating-save-btn"
                    onClick={() => void sticker.save()}
                    disabled={!sticker.canSave || sticker.isSaving || sticker.categories.length === 0}
                    aria-label="저장"
                >
                    <Save size={14} />
                    저장
                </button>
            </div>
        </aside>
    );
};


