export interface YtCategory {
    id: string;
    userId: string;
    name: string;
    colorHex: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface YtVideo {
    id: string;
    userId: string;
    videoId: string; // YouTube videoId
    url: string; // normalized watch url
    title: string;
    channelName: string | null;
    thumbnailUrl: string;
    categoryId: string;
    note: string;
    progressSec: number;
    durationSec: number | null;
    lastWatchedAt: Date | null;
    playerOverride: YtPlayerPrefs | null;
    loopA: number | null;
    loopB: number | null;
    loopEnabled: boolean;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface YtCategoryCreateInput {
    name: string;
    colorHex: string;
}

export interface YtVideoCreateInput {
    videoId: string;
    url: string;
    title: string;
    channelName: string | null;
    thumbnailUrl: string;
    categoryId: string;
    note: string;
}

export interface YtPlayerPrefs {
    volume: number; // 0..100
    muted: boolean;
    playbackRate: number; // 0.25..2
    theaterMode: boolean;
}

export interface YtUserPrefs {
    id: string; // uid
    userId: string;
    player: YtPlayerPrefs;
    autoResume: boolean;
    autoNext: boolean;
    removeCompletedFromQueue: boolean;
    queue: string[]; // yt_videos document ids
    updatedAt: Date;
}

export interface YtOEmbedResponse {
    title: string;
    author_name?: string;
    thumbnail_url?: string;
}


