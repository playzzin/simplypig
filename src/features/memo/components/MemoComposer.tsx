import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { memoCreateSchema } from "../schemas";
import { useMemoCategoriesQuery } from "../hooks/useMemoCategories";
import { useCreateMemoMutation } from "../hooks/useMemos";
import { MEMO_ROUTES } from "../constants";

interface MemoComposerProps {
    uid: string | null;
    variant?: "floating" | "page";
    onAfterSave?: () => void;
}

export const MemoComposer: React.FC<MemoComposerProps> = ({ uid, variant = "page", onAfterSave }) => {
    const navigate = useNavigate();
    const categoriesQuery = useMemoCategoriesQuery(uid);
    const createMemo = useCreateMemoMutation(uid);

    const categories = categoriesQuery.data ?? [];

    const [content, setContent] = useState("");
    const [categoryId, setCategoryId] = useState<string>("");

    useEffect(() => {
        if (!categoryId && categories.length > 0) {
            setCategoryId(categories[0]!.id);
        }
    }, [categories, categoryId]);

    const derivedTitle = useMemo(() => {
        const firstLine = content.split(/\r?\n/)[0] ?? "";
        return firstLine.trim();
    }, [content]);

    const handleCreateMemo = async () => {
        try {
            const titleForSave = derivedTitle.length > 0 ? derivedTitle : "메모";
            const validated = memoCreateSchema.parse({ title: titleForSave, content, categoryId });
            await createMemo.mutateAsync(validated);
            toast.success("메모를 저장했어요.");
            setContent("");
            onAfterSave?.();
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("메모 저장 중 오류가 발생했습니다.");
        }
    };

    const isFloating = variant === "floating";

    const headerClass = isFloating ? "text-sm font-semibold text-slate-100" : "text-base font-semibold text-slate-900 dark:text-slate-100";
    const cardClass = isFloating ? "rounded-2xl border border-white/10 bg-white/5 p-3" : "rounded-2xl border border-white/10 bg-white/5 p-3";

    return (
        <div className="space-y-3">
            <div className={cardClass}>
                {!isFloating && <div className={headerClass}>스티커 메모 작성</div>}
                <div className={isFloating ? "grid gap-2" : "mt-3 grid gap-2"}>
                    {categories.length === 0 ? (
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                            <span>카테고리가 없어서 저장할 수 없어요.</span>
                            <button
                                type="button"
                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-100 transition hover:bg-white/10"
                                onClick={() => navigate(MEMO_ROUTES.categories)}
                            >
                                카테고리 설정
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            {categories.map((c) => {
                                const isSelected = c.id === categoryId;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        className={`h-7 w-7 rounded-lg border transition ${
                                            isSelected ? "border-emerald-300/70 ring-2 ring-emerald-400/40" : "border-white/10 hover:border-white/20"
                                        }`}
                                        style={{ background: c.colorHex }}
                                        aria-label={`카테고리 선택: ${c.name}`}
                                        onClick={() => setCategoryId(c.id)}
                                        disabled={!uid || categoriesQuery.isLoading}
                                    >
                                        <span className="sr-only">{c.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className={isFloating ? "mt-2 grid gap-2" : "mt-3 grid gap-2"}>
                    {!isFloating && <label className="text-xs font-semibold text-slate-300">내용 (첫 줄이 제목으로 저장돼요)</label>}
                    <textarea
                        className="min-h-[160px] w-full resize-y rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={"첫 줄이 제목으로 저장됩니다.\n\n예)\n오늘 할 일\n- 운동 30분\n- 장보기"}
                        disabled={!uid}
                    />
                    {!isFloating && (
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>제목 미리보기: {derivedTitle.length > 0 ? derivedTitle : "메모"}</span>
                            <span>{content.length}/4000</span>
                        </div>
                    )}
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        className="h-10 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:opacity-60"
                        onClick={handleCreateMemo}
                        disabled={!uid || createMemo.isPending || categories.length === 0 || categoryId.length === 0}
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
};


