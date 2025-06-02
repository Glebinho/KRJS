import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { createCanvas } from 'canvas';
import cors from 'cors';

const app = express();
const PORT = 3005; 

app.use(cors());
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены'), false);
        }
    },
    limits: { fileSize: 20 * 1024 * 1024 },
});

async function createTextImage(text, options = {}) {
    const canvas = createCanvas(800, 150);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = options.color || '#000000';
    ctx.font = `${options.size || 40}px Arial`;
    ctx.fillText(text, 10, 50);

    return canvas.toBuffer();
}

app.post('/processimage', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'overlay', maxCount: 1 }]), async (req, res) => {
    try {
        const mainImage = req.files?.file?.[0];
        const overlayImage = req.files?.overlay?.[0];
        const operations = req.body;

        if (!mainImage) {
            throw new Error('Основное изображение не загружено');
        }

        let imageProcessor = sharp(mainImage.buffer);

        if (operations.width || operations.height) {
            imageProcessor = imageProcessor.resize(
                parseInt(operations.width) || null,
                parseInt(operations.height) || null
            );
        }

        if (operations.cropLeft && operations.cropTop && operations.cropWidth && operations.cropHeight) {
            imageProcessor = imageProcessor.extract({
                left: parseInt(operations.cropLeft),
                top: parseInt(operations.cropTop),
                width: parseInt(operations.cropWidth),
                height: parseInt(operations.cropHeight)
            });
        }

        if (operations.grayscale === 'true') imageProcessor = imageProcessor.grayscale();
        if (operations.rotate) imageProcessor = imageProcessor.rotate(parseFloat(operations.rotate));
        if (operations.blur) imageProcessor = imageProcessor.blur(parseFloat(operations.blur));

        if (operations.text) {
            const textBuffer = await createTextImage(operations.text, {
                color: operations.textColor,
                size: operations.textSize
            });
            imageProcessor = imageProcessor.composite([{ 
                input: textBuffer, 
                left: parseInt(operations.textX) || 0, 
                top: parseInt(operations.textY) || 0 
            }]);
        }

        if (overlayImage) {
            const overlay = await sharp(overlayImage.buffer).toBuffer();
            imageProcessor = imageProcessor.composite([{ 
                input: overlay, 
                left: parseInt(operations.overlayX) || 0, 
                top: parseInt(operations.overlayY) || 0 
            }]);
        }

        const format = operations.format || 'png';
        const outputBuffer = await imageProcessor.toFormat(format).toBuffer();

        res.set({
            'Content-Type': `image/${format}`,
            'Content-Disposition': `attachment; filename="processed-image.${format}"`,
            'Content-Length': outputBuffer.length
        });
        res.send(outputBuffer);

    } catch (err) {
        console.error('Ошибка обработки:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});