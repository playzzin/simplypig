import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { memoCategoryCreateSchema } from "../schemas";
import { useCreateMemoCategoryMutation, useDeleteMemoCategoryMutation, useMemoCategoriesQuery } from "../hooks/useMemoCategories";

interface MemoCategorySettingsPageProps {
    uid: string | null;
}

const DEFAULT_COLOR = "#22C55E" as const;

export const MemoCategorySettingsPage: React.FC<MemoCategorySettingsPageProps> = ({ uid }) => {
    const categoriesQuery = useMemoCategoriesQuery(uid);
    const createCategory = useCreateMemoCategoryMutation(uid);
    const deleteCategory = useDeleteMemoCategoryMutation(uid);

    const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

    const [name, setName] = useState("");
    const [colorHex, setColorHex] = useState<string>(DEFAULT_COLOR);

    const handleSave = async () => {
        try {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const validated = memoCategoryCreateSchema.parse({ name, colorHex });
            await createCategory.mutateAsync(validated);
            toast.success("카테고리를 저장했어요.");
            setName("");
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("저장 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory.mutateAsync(id);
            toast.success("카테고리를 삭제했어요.");
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("삭제 중 오류가 발생했습니다.");
        }
    };

    return (
        <main className="main-content">
            <div className="card glass space-y-4">
                <div>
                    <h2 className="view-title">카테고리 설정</h2>
                    <p className="lead">색상 기반 카테고리를 추가/관리합니다.</p>
                </div>

                {!uid && (
                    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Firebase 인증 준비 중입니다. 잠시만 기다려 주세요.
                    </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-slate-100">새 카테고리</div>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-300">이름</label>
                            <input
                                className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 text-sm text-slate-100 outline-none"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="예) 업무"
                                disabled={!uid}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-300">색상</label>
                            <div className="mt-2 flex items-center gap-3">
                                <input
                                    className="h-10 w-14 rounded-xl border border-white/10 bg-slate-950/40 p-1"
                                    type="color"
                                    value={colorHex}
                                    onChange={(e) => setColorHex(e.target.value)}
                                    disabled={!uid}
                                    aria-label="카테고리 색상 선택"
                                />
                                <div className="text-xs text-slate-300">{colorHex}</div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end">
                        <button
                            type="button"
                            className="h-10 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:opacity-60"
                            onClick={handleSave}
                            disabled={!uid || createCategory.isPending}
                        >
                            저장
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-slate-100">카테고리 목록</div>
                    {categoriesQuery.isLoading && <div className="mt-3 text-sm text-slate-200">로딩 중…</div>}
                    {categoriesQuery.error && (
                        <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                            카테고리를 불러오지 못했습니다. Firebase 설정/권한을 확인해 주세요.
                        </div>
                    )}
                    {!categoriesQuery.isLoading && categories.length === 0 && (
                        <div className="mt-3 text-sm text-slate-200">아직 카테고리가 없어요.</div>
                    )}
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {categories.map((c) => (
                            <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                <div className="flex items-center gap-3">
                                    <span
                                        className="h-4 w-4 rounded-full"
                                        style={{ background: c.colorHex }}
                                        title={c.name}
                                        aria-label={c.name}
                                    />
                                    <div className="text-sm font-semibold text-slate-100">{c.name}</div>
                                    <div className="text-xs text-slate-400">{c.colorHex}</div>
                                </div>
                                <button
                                    type="button"
                                    className="btn-icon"
                                    aria-label="삭제"
                                    onClick={() => handleDelete(c.id)}
                                    disabled={deleteCategory.isPending}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
};


