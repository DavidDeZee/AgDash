import { head } from '@vercel/blob';

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check authentication
        const password = req.headers['x-admin-password'];

        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get blob metadata using server-side token
        const blobInfo = await head('market-data-v2.xlsx', {
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        // Fetch the actual blob content
        const response = await fetch(blobInfo.downloadUrl);

        if (!response.ok) {
            return res.status(404).json({ error: 'Market data not found' });
        }

        const buffer = await response.arrayBuffer();

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Cache-Control', 'no-store');

        // Forward Last-Modified header if available
        const lastModified = response.headers.get('Last-Modified');
        if (lastModified) {
            res.setHeader('Last-Modified', lastModified);
        }

        res.send(Buffer.from(buffer));
    } catch (error: any) {
        console.error('Market data fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch market data: ' + (error.message || error) });
    }
}
