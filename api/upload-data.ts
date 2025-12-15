import { put } from '@vercel/blob';
import multer from 'multer';

// Configure multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

export const config = {
    api: {
        bodyParser: false, // Disallow Vercel from parsing body, let multer do it
    },
};

// Helper function to run middleware
function runMiddleware(req: any, res: any, fn: any) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: any) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Run multer middleware
        await runMiddleware(req, res, upload.single('file'));

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Upload to Blob storage
        const blob = await put('market-data-v2.xlsx', req.file.buffer, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false,
            allowOverwrite: true,
            cacheControlMaxAge: 0,
        });

        return res.status(200).json({ success: true, url: blob.url });
    } catch (error: any) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'Upload failed: ' + (error.message || error) });
    }
}
