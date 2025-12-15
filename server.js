
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { put } from '@vercel/blob';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
    const app = express();
    const upload = multer({ storage: multer.memoryStorage() });

    // Create Vite server in middleware mode and configure the app type as
    // 'custom', disabling Vite's own HTML serving logic so parent server
    // can take control
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
    });

    // Enable JSON body parsing for API requests
    app.use(express.json());

    // API Route for Admin Verification
    app.post('/api/verify-admin', (req, res) => {
        const { password } = req.body;
        if (password === process.env.ADMIN_PASSWORD) {
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Incorrect password' });
        }
    });

    // API Route for Upload
    app.post('/api/upload-data', upload.single('file'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file provided' });
            }

            console.log('Received file size:', req.file.size, 'bytes');

            const blob = await put('market-data-v2.xlsx', req.file.buffer, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN,
                addRandomSuffix: false, // Ensure constant filename
                allowOverwrite: true,
                cacheControlMaxAge: 0, // Disable edge caching for instant updates
            });

            console.log('Upload success:', blob.url);
            res.json({ success: true, url: blob.url });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Upload failed: ' + error.message });
        }
    });

    // Use vite's connect instance as middleware. If you use your own
    // express router (express.Router()), you should use router.use
    app.use(vite.middlewares);

    const port = 5174;
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        console.log(`API routes enabled locally.`);
    });
}

createServer();
