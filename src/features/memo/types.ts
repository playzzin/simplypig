export interface MemoCategory {
    id: string;
    userId: string;
    name: string;
    colorHex: string;
    createdAt: Date;
    updatedAt: Date;
}

export type MemoType = "text" | "todo" | "secret";

export interface TodoItem {
    id: string;
    text: string;
    done: boolean;
}

interface MemoBase {
    id: string;
    userId: string;
    title: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TextMemo extends MemoBase {
    type: "text";
    content: string;
}

export interface TodoMemo extends MemoBase {
    type: "todo";
    items: TodoItem[];
}

export interface SecretMemoEncryptedPayload {
    v: 1;
    kdf: "PBKDF2";
    cipher: "AES-GCM";
    iterations: number;
    saltB64: string;
    ivB64: string;
    ciphertextB64: string;
}

export interface SecretMemo extends MemoBase {
    type: "secret";
    encrypted: SecretMemoEncryptedPayload;
}

export type Memo = TextMemo | TodoMemo | SecretMemo;

export interface MemoCategoryCreateInput {
    name: string;
    colorHex: string;
}

export interface TextMemoCreateInput {
    type?: "text";
    title: string;
    content: string;
    categoryId: string;
}

export interface TodoMemoCreateInput {
    type: "todo";
    title: string;
    categoryId: string;
    items: TodoItem[];
}

export interface SecretMemoCreateInput {
    type: "secret";
    title: string;
    categoryId: string;
    encrypted: SecretMemoEncryptedPayload;
}

export type MemoCreateInput = TextMemoCreateInput | TodoMemoCreateInput | SecretMemoCreateInput;


