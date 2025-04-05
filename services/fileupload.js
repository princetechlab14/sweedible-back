const multer = require("multer");
const sharp = require("sharp");
const { S3Client, DeleteObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsBaseUrl = process.env.AWS_BASE_URL;

const s3Client = new S3Client({
    region: region,
    endpoint: awsBaseUrl,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    },
    forcePathStyle: false
});

const deleteObjS3 = async (fileName) => {
    const fileKey = fileName.replace(awsBaseUrl + "/" + bucketName + "/", "");
    const command = new DeleteObjectCommand({ Bucket: bucketName, Key: fileKey });
    try {
        await s3Client.send(command);
    } catch (err) {
        console.error("deleteObjS3 => ", err);
    }
};

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image and video files are allowed!"), false);
    }
};

const uploadToS3 = async (buffer, originalName) => {
    const extension = originalName.split(".").pop();
    const filenameWithoutExtension = originalName.replace(/\.[^/.]+$/, "");
    const sanitizedFilename = filenameWithoutExtension.replace(
        /[^a-zA-Z0-9]/g,
        ""
    );
    const sanitizedFileNameWithExtension = `${Date.now()}${sanitizedFilename}.${extension}`;
    const params = {
        Bucket: bucketName,
        Key: sanitizedFileNameWithExtension,
        Body: buffer,
        ContentType: `image/${extension}`,
        ACL: "public-read",
    };
    try {
        const data = await s3Client.send(new PutObjectCommand(params));
        const location = `${awsBaseUrl}/${bucketName}/${sanitizedFileNameWithExtension}`;
        return { ...data, Key: params.Key, Location: location };
    } catch (err) {
        console.error(err, 'errrrrrrrr');
        throw err;
    }
};

const customStorage = {
    _handleFile: (req, file, cb) => {
        const chunks = [];
        file.stream.on("data", (chunk) => chunks.push(chunk));
        file.stream.on("end", async () => {
            const buffer = Buffer.concat(chunks);
            const mimeType = file.mimetype;
            try {
                let processedBuffer = buffer;
                if (mimeType.startsWith("image/")) {
                    const image = sharp(buffer);
                    if (mimeType === "image/jpeg" || mimeType === "image/jpg")
                        processedBuffer = await image.jpeg({ quality: 60 }).toBuffer();
                    else if (mimeType === "image/png")
                        processedBuffer = await image.png({ quality: 60 }).toBuffer();
                    else if (mimeType === "image/webp")
                        processedBuffer = await image.webp({ quality: 60 }).toBuffer();
                    else if (mimeType === "image/gif")
                        processedBuffer = await image.gif({ quality: 60 }).toBuffer();
                }
                const result = await uploadToS3(processedBuffer, file.originalname);
                cb(null, { key: result.Key, location: result.Location });
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