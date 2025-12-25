import { ytVideoIdSchema } from "../schemas";

type ParseResult = { videoId: string; normalizedUrl: string };

const normalizeWatchUrl = (videoId: string): string => `https://www.youtube.com/watch?v=${videoId}`;

export const parseYoutubeUrl = (input: string): ParseResult => {
    const raw = input.trim();
    if (raw.length === 0) throw new Error("유튜브 주소를 입력하세요.");

    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        throw new Error("유효한 URL 형식이 아닙니다.");
    }

    const host = url.hostname.replace(/^www\./, "");

    // youtu.be/<id>
    if (host === "youtu.be") {
        const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
        const videoId = ytVideoIdSchema.parse(id);
        return { videoId, normalizedUrl: normalizeWatchUrl(videoId) };
    }

    // youtube.com/watch?v=<id>
    if (host.endsWith("youtube.com")) {
        const path = url.pathname;

        if (path === "/watch") {
            const id = url.searchParams.get("v") ?? "";
            const videoId = ytVideoIdSchema.parse(id);
            return { videoId, normalizedUrl: normalizeWatchUrl(videoId) };
        }

        // youtube.com/shorts/<id>
        if (path.startsWith("/shorts/")) {
            const id = path.replace("/shorts/", "").split("/")[0] ?? "";
            const videoId = ytVideoIdSchema.parse(id);
            return { videoId, normalizedUrl: normalizeWatchUrl(videoId) };
        }

        // youtube.com/embed/<id>
        if (path.startsWith("/embed/")) {
            const id = path.replace("/embed/", "").split("/")[0] ?? "";
            const videoId = ytVideoIdSchema.parse(id);
            return { videoId, normalizedUrl: normalizeWatchUrl(videoId) };
        }
    }

    throw new Error("지원하지 않는 유튜브 주소 형식입니다. (watch/shorts/youtu.be 링크를 사용하세요)");
};


