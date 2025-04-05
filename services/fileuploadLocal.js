const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const localUploadDir = path.join(__dirname, "../public/images");
if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
}

const deleteObjS3 = async (fileName) => {
    const filePath = path.join(localUploadDir, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted local file: ${fileName}`);
    }
};

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image and video files are allowed!"), false);
    }
};

const processAndSaveLocal = async (buffer, filename, mimetype) => {
    let processedBuffer = buffer;
    const image = sharp(buffer);

    if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
        processedBuffer = await image.jpeg({ quality: 60 }).toBuffer();
    } else if (mimetype === "image/png") {
        processedBuffer = await image.png({ quality: 60 }).toBuffer();
    } else if (mimetype === "image/webp") {
        processedBuffer = await image.webp({ quality: 60 }).toBuffer();
    }

    const filePath = path.join(localUploadDir, filename);
    fs.writeFileSync(filePath, processedBuffer);
    return `/images/${filename}`;
};

const customStorage = {
    _handleFile: (req, file, cb) => {
        const chunks = [];
        file.stream.on("data", (chunk) => chunks.push(chunk));
        file.stream.on("end", async () => {
            const buffer = Buffer.concat(chunks);
            const mimeType = file.mimetype;
            try {
                const result = await processAndSaveLocal(buffer, file.originalname, mimeType);
                cb(null, { location: result });
            } catch (err) {
                cb(err);
            }
        });
    },
    _removeFile: (req, file, cb) => cb(null),
};

const upload = multer({
    storage: customStorage,
    fileFilter: fileFilter,
});
module.exports = { upload, deleteObjS3 };