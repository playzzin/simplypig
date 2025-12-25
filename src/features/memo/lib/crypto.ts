const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toB64 = (bytes: Uint8Array): string => {
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
};

const fromB64 = (b64: string): Uint8Array => {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
};

const randomBytes = (len: number): Uint8Array => {
    const out = new Uint8Array(len);
    crypto.getRandomValues(out);
    return out;
};

export type SecretCryptoPayloadV1 = {
    v: 1;
    kdf: "PBKDF2";
    cipher: "AES-GCM";
    iterations: number;
    saltB64: string;
    ivB64: string;
    ciphertextB64: string;
};

const deriveAesKey = async (password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> => {
    const baseKey = await crypto.subtle.importKey("raw", textEncoder.encode(password), { name: "PBKDF2" }, false, [
        "deriveKey",
    ]);
    return await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
};

export const encryptSecretText = async (plaintext: string, password: string): Promise<SecretCryptoPayloadV1> => {
    const iterations = 210_000;
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = await deriveAesKey(password, salt, iterations);

    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEncoder.encode(plaintext));

    return {
        v: 1,
        kdf: "PBKDF2",
        cipher: "AES-GCM",
        iterations,
        saltB64: toB64(salt),
        ivB64: toB64(iv),
        ciphertextB64: toB64(new Uint8Array(ciphertext)),
    };
};

export const decryptSecretText = async (payload: SecretCryptoPayloadV1, password: string): Promise<string> => {
    const salt = fromB64(payload.saltB64);
    const iv = fromB64(payload.ivB64);
    const ciphertext = fromB64(payload.ciphertextB64);
    const key = await deriveAesKey(password, salt, payload.iterations);

    const plaintextBytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return textDecoder.decode(plaintextBytes);
};


