export const YT_MENU_TEXT = "유튜브" as const;

export const YT_VIEWS = {
    library: "유튜브 라이브러리",
    add: "유튜브 추가",
    categories: "유튜브 카테고리",
    queue: "유튜브 큐",
} as const;

export const YT_ROUTES = {
    root: "/yt",
    library: "/yt/library",
    add: "/yt/add",
    categories: "/yt/categories",
    queue: "/yt/queue",
    watch: "/yt/watch/:videoDocId",
    edit: "/yt/edit/:videoDocId",
} as const;

export const buildYtWatchRoute = (videoDocId: string): string => `/yt/watch/${videoDocId}`;
export const buildYtEditRoute = (videoDocId: string): string => `/yt/edit/${videoDocId}`;

export const getYtRouteForView = (view: string): string | null => {
    if (view === YT_VIEWS.library) return YT_ROUTES.library;
    if (view === YT_VIEWS.add) return YT_ROUTES.add;
    if (view === YT_VIEWS.categories) return YT_ROUTES.categories;
    if (view === YT_VIEWS.queue) return YT_ROUTES.queue;
    return null;
};

export const getYtViewForPath = (pathname: string): string | null => {
    if (pathname.startsWith(YT_ROUTES.library)) return YT_VIEWS.library;
    if (pathname.startsWith(YT_ROUTES.add)) return YT_VIEWS.add;
    if (pathname.startsWith(YT_ROUTES.categories)) return YT_VIEWS.categories;
    if (pathname.startsWith(YT_ROUTES.queue)) return YT_VIEWS.queue;
    if (pathname.startsWith(YT_ROUTES.root)) return YT_VIEWS.library;
    return null;
};


