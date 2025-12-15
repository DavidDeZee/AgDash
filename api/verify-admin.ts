export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password } = req.body;
        if (password === process.env.ADMIN_PASSWORD) {
            res.status(200).json({ success: true });
        } else {
            res.status(401).json({ error: 'Incorrect password' });
        }
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
