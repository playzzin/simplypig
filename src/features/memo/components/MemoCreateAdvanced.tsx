import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Plus, ShieldCheck, ListTodo } from "lucide-react";
import { MEMO_ROUTES } from "../constants";
import { useMemoCategoriesQuery } from "../hooks/useMemoCategories";
import { useCreateMemoMutation } from "../hooks/useMemos";
import { encryptSecretText } from "../lib/crypto";
import type { TodoItem } from "../types";

type MemoKind = "text" | "todo" | "secret";

interface MemoCreateAdvancedProps {
    uid: string | null;
}

const makeId = (): string => {
    const rnd = Math.random().toString(16).slice(2);
    return `t_${Date.now().toString(16)}_${rnd}`;
};

export const MemoCreateAdvanced: React.FC<MemoCreateAdvancedProps> = ({ uid }) => {
    const navigate = useNavigate();
    const categoriesQuery = useMemoCategoriesQuery(uid);
    const createMemo = useCreateMemoMutation(uid);

    const categories = categoriesQuery.data ?? [];

    const [kind, setKind] = useState<MemoKind>("todo");
    const [categoryId, setCategoryId] = useState("");

    useEffect(() => {
        if (categoryId) return;
        if (categories.length === 0) return;
        setCategoryId(categories[0]!.id);
    }, [categories, categoryId]);

    // text
    const [textContent, setTextContent] = useState("");
    const textTitle = useMemo(() => (textContent.split(/\r?\n/)[0] ?? "").trim(), [textContent]);

    // todo
    const [todoDraft, setTodoDraft] = useState("");
    const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
    const todoTitle = useMemo(() => {
        const first = todoItems[0]?.text?.trim();
        return first && first.length > 0 ? first : "할 일";
    }, [todoItems]);

    // secret
    const [secretContent, setSecretContent] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const canSave = useMemo(() => {
        if (!uid) return false;
        if (!categoryId) return false;
        if (kind === "text") return textContent.trim().length > 0;
        if (kind === "todo") return todoItems.length > 0;
        return secretContent.trim().length > 0 && password.length >= 4 && password === passwordConfirm;
    }, [uid, categoryId, kind, textContent, todoItems, secretContent, password, passwordConfirm]);

    const addTodoItem = () => {
        const next = todoDraft.trim();
        if (next.length === 0) return;
        setTodoItems((prev) => [...prev, { id: makeId(), text: next, done: false }]);
        setTodoDraft("");
    };

    const removeTodoItem = (id: string) => {
        setTodoItems((prev) => prev.filter((i) => i.id !== id));
    };

    const toggleTodoDraftDone = (id: string) => {
        setTodoItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
    };

    const save = async () => {
        try {
            if (!uid) throw new Error("로그인이 필요합니다.");
            if (!categoryId) throw new Error("카테고리를 선택하세요.");

            if (kind === "text") {
                const title = textTitle.length > 0 ? textTitle : "메모";
                await createMemo.mutateAsync({ type: "text", title, content: textContent, categoryId });
                toast.success("메모를 저장했어요.");
                setTextContent("");
                return;
            }

            if (kind === "todo") {
                await createMemo.mutateAsync({ type: "todo", title: todoTitle, categoryId, items: todoItems });
                toast.success("할 일 메모를 저장했어요.");
                setTodoItems([]);
                setTodoDraft("");
                return;
            }

            if (password !== passwordConfirm) throw new Error("비밀번호가 일치하지 않습니다.");
            if (password.length < 4) throw new Error("비밀번호는 4자 이상으로 입력하세요.");

            const encrypted = await encryptSecretText(secretContent, password);
            await createMemo.mutateAsync({ type: "secret", title: "비밀 메모", categoryId, encrypted });
            toast.success("비밀 메모를 저장했어요.");
            setSecretContent("");
            setPassword("");
            setPasswordConfirm("");
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("저장 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="space-y-4">
            {categories.length === 0 ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    <span>카테고리가 없어서 메모를 만들 수 없어요.</span>
                    <button
                        type="button"
                        className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                        onClick={() => navigate(MEMO_ROUTES.categories)}
                    >
                        카테고리 설정
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {categories.map((c) => {
                            const isSelected = c.id === categoryId;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`h-8 w-8 rounded-lg border transition ${
                                        isSelected ? "border-emerald-300/70 ring-2 ring-emerald-400/40" : "border-white/10 hover:border-white/20"
                                    }`}
                                    style={{ background: c.colorHex }}
                                    aria-label={`카테고리 선택: ${c.name}`}
                                    onClick={() => setCategoryId(c.id)}
                                >
                                    <span className="sr-only">{c.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className={`h-10 rounded-xl border px-4 text-sm font-semibold transition ${
                                kind === "todo"
                                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                                    : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                            }`}
                            onClick={() => setKind("todo")}
                        >
                            <span className="inline-flex items-center gap-2">
                                <ListTodo size={16} />
                                할일
                            </span>
                        </button>
                        <button
                            type="button"
                            className={`h-10 rounded-xl border px-4 text-sm font-semibold transition ${
                                kind === "text"
                                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                                    : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                            }`}
                            onClick={() => setKind("text")}
                        >
                            <span className="inline-flex items-center gap-2">
                                <ShieldCheck size={16} />
                                일반
                            </span>
                        </button>
                        <button
                            type="button"
                            className={`h-10 rounded-xl border px-4 text-sm font-semibold transition ${
                                kind === "secret"
                                    ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
                                    : "border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                            }`}
                            onClick={() => setKind("secret")}
                        >
                            <span className="inline-flex items-center gap-2">
                                <Lock size={16} />
                                비밀
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {kind === "text" && (
                <textarea
                    className="min-h-[220px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-100 outline-none"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder={"첫 줄이 제목으로 저장됩니다.\n\n예)\n회의 메모\n- 10시 팀 미팅\n- 이슈 정리"}
                    disabled={!uid || categories.length === 0}
                />
            )}

            {kind === "todo" && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <input
                            className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100 outline-none"
                            value={todoDraft}
                            onChange={(e) => setTodoDraft(e.target.value)}
                            placeholder="할 일을 입력하고 + 로 추가"
                            disabled={!uid || categories.length === 0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addTodoItem();
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn-icon"
                            aria-label="할 일 추가"
                            onClick={addTodoItem}
                            disabled={!uid || categories.length === 0}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {todoItems.length === 0 ? (
                            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                                할 일 항목을 추가해 주세요.
                            </div>
                        ) : (
                            todoItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                                >
                                    <label className="flex items-center gap-3 text-sm text-slate-100">
                                        <input
                                            type="checkbox"
                                            checked={item.done}
                                            onChange={() => toggleTodoDraftDone(item.id)}
                                        />
                                        <span className={item.done ? "line-through text-slate-400" : ""}>{item.text}</span>
                                    </label>
                                    <button
                                        type="button"
                                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                                        onClick={() => removeTodoItem(item.id)}
                                    >
                                        삭제
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {kind === "secret" && (
                <div className="space-y-3">
                    <textarea
                        className="min-h-[200px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-100 outline-none"
                        value={secretContent}
                        onChange={(e) => setSecretContent(e.target.value)}
                        placeholder={"여기에 비밀 내용을 입력하세요.\n저장하면 암호화되어 Firestore에 저장됩니다."}
                        disabled={!uid || categories.length === 0}
                    />
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <input
                            className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100 outline-none"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호(4자 이상)"
                            disabled={!uid || categories.length === 0}
                        />
                        <input
                            className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100 outline-none"
                            type="password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            placeholder="비밀번호 확인"
                            disabled={!uid || categories.length === 0}
                        />
                    </div>
                    <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
                        비밀번호는 서버에 저장되지 않습니다. 비밀번호를 잊으면 복구할 수 없어요.
                    </div>
                </div>
            )}

            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                    onClick={() => navigate(MEMO_ROUTES.list)}
                >
                    목록으로
                </button>
                <button
                    type="button"
                    className="h-10 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:opacity-60"
                    onClick={() => void save()}
                    disabled={!canSave || createMemo.isPending || categories.length === 0}
                >
                    저장
                </button>
            </div>
        </div>
    );
};


