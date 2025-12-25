import { z } from "zod";

export const colorHexSchema = z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "색상 값은 #RRGGBB 형식이어야 합니다.");

export const ytCategoryCreateSchema = z.object({
    name: z.string().trim().min(1, "카테고리 이름을 입력하세요.").max(24, "카테고리 이름은 24자 이하로 입력하세요."),
    colorHex: colorHexSchema,
});

export const ytCategoryUpdateSchema = ytCategoryCreateSchema;

export const ytVideoIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{6,20}$/, "유효하지 않은 YouTube videoId 입니다.");

export const ytVideoCreateSchema = z.object({
    videoId: ytVideoIdSchema,
    url: z.string().url(),
    title: z.string().trim().min(1).max(160),
    channelName: z.string().trim().min(1).max(120).nullable(),
    thumbnailUrl: z.string().url(),
    categoryId: z.string().trim().min(1),
    note: z.string().trim().max(500),
});

export const ytVideoUpdateSchema = z.object({
    title: z.string().trim().min(1).max(160),
    categoryId: z.string().trim().min(1),
    note: z.string().trim().max(500),
});

export const ytPlayerPrefsSchema = z.object({
    volume: z.number().int().min(0).max(100),
    muted: z.boolean(),
    playbackRate: z.number().min(0.25).max(2),
    theaterMode: z.boolean(),
});

export const ytCategoryDocSchema = z.object({
    userId: z.string().min(1),
    name: z.string().min(1).max(24),
    colorHex: colorHexSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const ytVideoDocSchema = z.object({
    userId: z.string().min(1),
    videoId: ytVideoIdSchema,
    url: z.string().url(),
    title: z.string().min(1).max(160),
    channelName: z.string().min(1).max(120).nullable(),
    thumbnailUrl: z.string().url(),
    categoryId: z.string().min(1),
    note: z.string().max(500),
    progressSec: z.number().min(0).default(0),
    durationSec: z.number().min(0).nullable().default(null),
    lastWatchedAt: z.date().nullable().default(null),
    playerOverride: ytPlayerPrefsSchema.nullable().default(null),
    loopA: z.number().min(0).nullable().default(null),
    loopB: z.number().min(0).nullable().default(null),
    loopEnabled: z.boolean().default(false),
    completed: z.boolean().default(false),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const ytUserPrefsDocSchema = z.object({
    userId: z.string().min(1),
    player: ytPlayerPrefsSchema,
    autoResume: z.boolean().default(true),
    autoNext: z.boolean().default(true),
    removeCompletedFromQueue: z.boolean().default(true),
    queue: z.array(z.string().min(1)).max(300).default([]),
    updatedAt: z.date(),
});


