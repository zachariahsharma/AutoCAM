import argon2 from 'argon2';

export async function hash(password: string) {
    return await argon2.hash(password);
}

export async function verify(password: string, hash: string) {
    return await argon2.verify(hash, password);
}