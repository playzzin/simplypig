import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { memoCreateSchema } from "../schemas";
import { useMemoCategoriesQuery } from "./useMemoCategories";
import { useCreateMemoMutation } from "./useMemos";

type UseFloatingStickerMemoParams = {
    uid: string | null;
    onAfterSave?: () => void;
};

type UseFloatingStickerMemoResult = {
    content: string;
    setContent: (next: string) => void;
    derivedTitle: string;

    categories: Array<{ id: string; name: string; colorHex: string }>;
    isCategoriesLoading: boolean;
    selectedCategoryId: string;
    setSelectedCategoryId: (id: string) => void;
    selectedCategoryColorHex: string | null;

    canSave: boolean;
    isSaving: boolean;
    save: () => Promise<void>;
};

export const useFloatingStickerMemo = ({ uid, onAfterSave }: UseFloatingStickerMemoParams): UseFloatingStickerMemoResult => {
    const categoriesQuery = useMemoCategoriesQuery(uid);
    const createMemo = useCreateMemoMutation(uid);

    const categories = useMemo(() => {
        const raw = categoriesQuery.data ?? [];
        return raw.map((c) => ({ id: c.id, name: c.name, colorHex: c.colorHex }));
    }, [categoriesQuery.data]);

    const [content, setContent] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

    useEffect(() => {
        if (selectedCategoryId) return;
        if (categories.length === 0) return;
        setSelectedCategoryId(categories[0]!.id);
    }, [categories, selectedCategoryId]);

    const derivedTitle = useMemo(() => {
        const firstLine = content.split(/\r?\n/)[0] ?? "";
        return firstLine.trim();
    }, [content]);

    const selectedCategoryColorHex = useMemo(() => {
        const found = categories.find((c) => c.id === selectedCategoryId) ?? null;
        return found?.colorHex ?? null;
    }, [categories, selectedCategoryId]);

    const canSave = Boolean(uid) && content.trim().length > 0 && selectedCategoryId.trim().length > 0;

    const save = async () => {
        try {
            if (!uid) throw new Error("로그인이 필요합니다.");
            const titleForSave = derivedTitle.length > 0 ? derivedTitle : "메모";
            const validated = memoCreateSchema.parse({
                title: titleForSave,
                content,
                categoryId: selectedCategoryId,
            });
            await createMemo.mutateAsync(validated);
            toast.success("저장 완료");
            setContent("");
            onAfterSave?.();
        } catch (e: unknown) {
            if (e instanceof Error) toast.error(e.message);
            else toast.error("저장 중 오류가 발생했습니다.");
        }
    };

    return {
        content,
        setContent,
        derivedTitle,
        categories,
        isCategoriesLoading: categoriesQuery.isLoading,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedCategoryColorHex,
        canSave,
        isSaving: createMemo.isPending,
        save,
    };
};


