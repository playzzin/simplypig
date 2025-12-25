import { z } from "zod";
import { parseYoutubeUrl } from "./youtubeUrl";

export type MediaPlatform = "youtube" | "tiktok";

export type ParseMediaResult = {
    platform: MediaPlatform;
    mediaId: string;
    normalizedUrl: string;
};

const tiktokIdSchema = z
    .string()
    .trim()
    .min(2, "유효하지 않은 TikTok id 입니다.")
    .max(80, "유효하지 않은 TikTok id 입니다.");

const normalizeTiktokUrl = (pathname: string): string => `https://www.tiktok.com${pathname}`;

const parseTiktokUrl = (input: string): Omit<ParseMediaResult, "platform"> => {
    const raw = input.trim();
    if (raw.length === 0) throw new Error("틱톡 주소를 입력하세요.");

    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        throw new Error("유효한 URL 형식이 아닙니다.");
    }

    const host = url.hostname.replace(/^www\./, "");
    if (!host.endsWith("tiktok.com")) {
        throw new Error("지원하지 않는 틱톡 주소 형식입니다.");
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length === 0) throw new Error("지원하지 않는 틱톡 주소 형식입니다.");

    // /@user/video/<id>
    const videoIdx = parts.findIndex((p) => p === "video");
    if (videoIdx >= 0) {
        const id = parts[videoIdx + 1] ?? "";
        const mediaId = tiktokIdSchema.parse(id);
        return { mediaId, normalizedUrl: normalizeTiktokUrl(url.pathname) };
    }

    // /t/<shortCode> (리다이렉트 short 링크 케이스)
    if (parts[0] === "t" && parts[1]) {
        const mediaId = tiktokIdSchema.parse(parts[1]);
        return { mediaId, normalizedUrl: normalizeTiktokUrl(url.pathname) };
    }

    // 기타: 마지막 세그먼트를 id로 취급 (최소한 "링크 저장"은 되게)
    const last = parts[parts.length - 1] ?? "";
    const mediaId = tiktokIdSchema.parse(last);
    return { mediaId, normalizedUrl: normalizeTiktokUrl(url.pathname) };
};

export const parseMediaUrl = (input: string): ParseMediaResult => {
    try {
        const yt = parseYoutubeUrl(input);
        return { platform: "youtube", mediaId: yt.videoId, normalizedUrl: yt.normalizedUrl };
    } catch {
        // ignore and try TikTok
    }

    const tt = parseTiktokUrl(input);
    return { platform: "tiktok", mediaId: tt.mediaId, normalizedUrl: tt.normalizedUrl };
};


