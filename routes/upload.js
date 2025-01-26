// upload.js
const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

const storage = new Storage();
const bucketName = 'storagedat'; // Замените на имя вашего bucket

const router = express.Router();  // Использование Router для маршрутов
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'C:/Users/User/OneDrive/Рабочий стол/dating site/datingSiteBack/config/data-site-444114-adaf4a1d6c24.json';


router.post('/avatar', upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  try {
    const file = storage.bucket(bucketName).file(Date.now() + path.extname(req.file.originalname));
    const blobStream = file.createWriteStream({
      resumable: true, // Для больших файлов
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;
      await file.makePublic(); // Делаем объект публичным

      res.status(200).json({
        message: 'File uploaded successfully',
        fileUrl: publicUrl,
      });
    });

    blobStream.on('error', (err) => {
      console.error('Error during file upload:', err);
      res.status(500).json({ message: 'Error uploading file', error: err.message });
    });

    blobStream.end(req.file.buffer); // Загружаем файл из памяти
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ message: 'Error uploading file', error: err.message });
  }
});

module.exports = router;
