const crypto = require('crypto');

const algorithm = process.env.ENCRYPT_ALGORITHM || "aes-256-cbc";
const originalKey = process.env.ENCRYPT_KEY || "strong-passphrase";

const secretKey = crypto.createHash("sha256").update(originalKey).digest("base64").substr(0, 32);

const encrypt = (text) => {
    if (typeof text != 'string') {
        text = JSON.stringify(text);
    }
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, "utf8"), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return { iv: iv.toString("hex"), end: encrypted };
};

module.exports = { encrypt };