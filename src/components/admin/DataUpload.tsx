import React, { useState } from 'react';

export function DataUpload() {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);

        if (!file.name.endsWith('.xlsx')) {
            setMessage('Please upload an Excel file (.xlsx)');
            return;
        }

        setUploading(true);
        setMessage('Uploading...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            // NOTE: In local Vite dev, /api/upload-data might not exist unless proxied or using vercel dev.
            // If this fails 404 locally, it's expected without Vercel Dev.
            const response = await fetch('/api/upload-data', {
                method: 'POST',
                body: formData,
            });

            let result;
            try {
                result = await response.json();
            } catch (e) {
                throw new Error(`Server returned ${response.status} ${response.statusText}`);
            }

            if (response.ok && result.success) {
                setMessage('✓ Upload successful! Syncing with network...');
                // Start 25 second countdown for propagation
                let progress = 0;
                const totalTime = 25000;
                const intervalTime = 100;
                const steps = totalTime / intervalTime;
                const increment = 100 / steps;

                const interval = setInterval(() => {
                    progress += increment;
                    if (progress > 100) progress = 100;
                    const bar = document.getElementById('propagation-bar');
                    if (bar) bar.style.width = `${progress}%`;
                }, intervalTime);

                setTimeout(() => {
                    clearInterval(interval);
                    window.location.reload();
                }, totalTime);
            } else {
                setMessage('✗ Upload failed: ' + (result?.error || response.statusText));
            }
        } catch (error) {
            setMessage('✗ Upload failed: ' + (error as Error).message);
            console.error(error);
        } finally {
            setUploading(false);
            // Reset input so same file can be selected again if needed? 
            // Or leave it. User didn't ask.
        }
    }

    return (
        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
            <h2 className="text-xl font-bold mb-4">Upload Market Data</h2>
            <p className="text-sm text-muted-foreground mb-4">
                Upload an Excel file (.xlsx) with market share data.
            </p>

            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || message.includes('Syncing')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {uploading ? 'Uploading...' : 'Choose File'}
                    </button>

                    {fileName && (
                        <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                            {fileName}
                        </span>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx"
                        onChange={handleUpload}
                        disabled={uploading || message.includes('Syncing')}
                        className="hidden"
                    />
                </div>

                {/* Progress Bar Container */}
                {(uploading || message.includes('Syncing')) && (
                    <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                        <div
                            id="propagation-bar"
                            className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                            style={{ width: uploading ? '100%' : '0%', opacity: message.includes('Syncing') ? 1 : 0.5 }}
                        ></div>
                    </div>
                )}

                {message && (
                    <div className={`text-sm font-medium ${message.startsWith('✓') ? 'text-green-600' : message.startsWith('✗') ? 'text-destructive' : 'text-blue-600'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}
