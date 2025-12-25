import type { YtOEmbedResponse } from "../types";

const fallbackThumbnail = (videoId: string): string => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

export type YoutubeMetadata = {
    title: string;
    channelName: string | null;
    thumbnailUrl: string;
    source: "oembed" | "fallback";
};

export const fetchYoutubeMetadata = async (normalizedWatchUrl: string, videoId: string): Promise<YoutubeMetadata> => {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedWatchUrl)}&format=json`;

    try {
        const res = await fetch(endpoint, { method: "GET" });
        if (!res.ok) throw new Error("oEmbed request failed");
        const json: unknown = await res.json();
        const data = json as YtOEmbedResponse;

        const title = typeof data.title === "string" && data.title.trim().length > 0 ? data.title.trim() : "YouTube";
        const channelName =
            typeof data.author_name === "string" && data.author_name.trim().length > 0 ? data.author_name.trim() : null;
        const thumbnailUrl =
            typeof data.thumbnail_url === "string" && data.thumbnail_url.trim().length > 0
                ? data.thumbnail_url.trim()
                : fallbackThumbnail(videoId);

        return { title, channelName, thumbnailUrl, source: "oembed" };
    } catch {
        // CORS/차단/일시 장애를 고려한 fallback: thumbnail은 고정 CDN 패턴으로 제공
        return {
            title: "YouTube",
            channelName: null,
            thumbnailUrl: fallbackThumbnail(videoId),
            source: "fallback",
        };
    }
};

export type TiktokMetadata = {
    title: string;
    channelName: string | null;
    thumbnailUrl: string | null;
    source: "oembed" | "fallback";
};

type TiktokOEmbedLike = {
    title?: unknown;
    author_name?: unknown;
    thumbnail_url?: unknown;
};

export const fetchTiktokMetadata = async (normalizedUrl: string): Promise<TiktokMetadata> => {
    // NOTE: TikTok은 환경에 따라 CORS/차단이 있을 수 있어 "best-effort + fallback"으로 처리한다.
    const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(normalizedUrl)}`;

    try {
        const res = await fetch(endpoint, { method: "GET" });
        if (!res.ok) throw new Error("oEmbed request failed");
        const json: unknown = await res.json();
        const data = json as TiktokOEmbedLike;

        const title = typeof data.title === "string" && data.title.trim().length > 0 ? data.title.trim() : "TikTok";
        const channelName =
            typeof data.author_name === "string" && data.author_name.trim().length > 0 ? data.author_name.trim() : null;
        const thumbnailUrl =
            typeof data.thumbnail_url === "string" && data.thumbnail_url.trim().length > 0 ? data.thumbnail_url.trim() : null;

        return { title, channelName, thumbnailUrl, source: "oembed" };
    } catch {
        return { title: "TikTok", channelName: null, thumbnailUrl: null, source: "fallback" };
    }
};


