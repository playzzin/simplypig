import { z } from "zod";

export const colorHexSchema = z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "색상 값은 #RRGGBB 형식이어야 합니다.");

export const memoCategoryCreateSchema = z.object({
    name: z.string().trim().min(1, "카테고리 이름을 입력하세요.").max(40, "카테고리 이름은 40자 이하로 입력하세요."),
    colorHex: colorHexSchema,
});

const titleSchema = z.string().trim().min(1, "제목을 입력하세요.").max(80, "제목은 80자 이하로 입력하세요.");
const categoryIdSchema = z.string().trim().min(1, "카테고리를 선택하세요.");

export const textMemoCreateSchema = z.object({
    type: z.literal("text").optional(),
    title: titleSchema,
    content: z.string().trim().min(1, "내용을 입력하세요.").max(4000, "내용은 4000자 이하로 입력하세요."),
    categoryId: categoryIdSchema,
});

export const todoItemSchema = z.object({
    id: z.string().min(1),
    text: z.string().trim().min(1).max(120),
    done: z.boolean(),
});

export const todoMemoCreateSchema = z.object({
    type: z.literal("todo"),
    title: titleSchema,
    categoryId: categoryIdSchema,
    items: z.array(todoItemSchema).min(1, "할 일 항목을 1개 이상 추가하세요.").max(50, "할 일 항목은 50개 이하로 입력하세요."),
});

export const secretEncryptedPayloadSchema = z.object({
    v: z.literal(1),
    kdf: z.literal("PBKDF2"),
    cipher: z.literal("AES-GCM"),
    iterations: z.number().int().min(50_000).max(600_000),
    saltB64: z.string().min(1),
    ivB64: z.string().min(1),
    ciphertextB64: z.string().min(1),
});

export const secretMemoCreateSchema = z.object({
    type: z.literal("secret"),
    title: titleSchema,
    categoryId: categoryIdSchema,
    encrypted: secretEncryptedPayloadSchema,
});

export const memoCreateSchema = z.union([textMemoCreateSchema, todoMemoCreateSchema, secretMemoCreateSchema]);

export const memoCategoryDocSchema = z.object({
    userId: z.string().min(1),
    name: z.string().min(1).max(40),
    colorHex: colorHexSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});

const memoDocBaseSchema = z.object({
    userId: z.string().min(1),
    title: z.string().min(1).max(80),
    categoryId: z.string().min(1),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// Backwards compatibility: 기존 문서에 type이 없으면 text로 간주
const textMemoDocSchema = memoDocBaseSchema.extend({
    type: z.literal("text").optional(),
    content: z.string().min(1).max(4000),
});

const todoMemoDocSchema = memoDocBaseSchema.extend({
    type: z.literal("todo"),
    items: z.array(todoItemSchema).max(50),
});

const secretMemoDocSchema = memoDocBaseSchema.extend({
    type: z.literal("secret"),
    encrypted: secretEncryptedPayloadSchema,
});

export const memoDocSchema = z.union([textMemoDocSchema, todoMemoDocSchema, secretMemoDocSchema]);


