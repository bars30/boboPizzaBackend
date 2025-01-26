const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Настройка AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Настройка multer для загрузки в S3
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: 'public-read', // Права доступа к файлам
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            cb(null, `uploads/${Date.now().toString()}-${file.originalname}`);
        },
    }),
});

module.exports = upload;
