export const MEMO_MENU_TEXT = "메모장" as const;

export const MEMO_VIEWS = {
    list: "메모 목록",
    create: "새 메모",
    categories: "카테고리 설정",
} as const;

export const MEMO_ROUTES = {
    root: "/memo",
    list: "/memo/list",
    create: "/memo/new",
    categories: "/memo/categories",
    edit: "/memo/edit/:memoId",
} as const;

export const buildMemoEditRoute = (memoId: string): string => `/memo/edit/${memoId}`;

export const getMemoRouteForView = (view: string): string | null => {
    if (view === MEMO_VIEWS.list) return MEMO_ROUTES.list;
    if (view === MEMO_VIEWS.create) return MEMO_ROUTES.create;
    if (view === MEMO_VIEWS.categories) return MEMO_ROUTES.categories;
    return null;
};

export const getMemoViewForPath = (pathname: string): string | null => {
    if (pathname.startsWith(MEMO_ROUTES.list)) return MEMO_VIEWS.list;
    if (pathname.startsWith(MEMO_ROUTES.create)) return MEMO_VIEWS.create;
    if (pathname.startsWith(MEMO_ROUTES.categories)) return MEMO_VIEWS.categories;
    if (pathname.startsWith(MEMO_ROUTES.root)) return MEMO_VIEWS.list;
    return null;
};


