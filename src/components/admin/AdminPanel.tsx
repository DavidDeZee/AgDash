import { useState } from 'react';
import { DataUpload } from './DataUpload';
import { X, Lock, Loader2 } from 'lucide-react';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
    if (!isOpen) return null;
    return <AdminPanelContent onClose={onClose} />;
}

interface AdminPanelContentProps {
    onClose: () => void;
}

function AdminPanelContent({ onClose }: AdminPanelContentProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/verify-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setIsAuthenticated(true);
            } else {
                setError(data.error || 'Invalid password');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                    <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {!isAuthenticated ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="text-center space-y-2">
                                <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium">Authentication Required</h3>
                                <p className="text-sm text-muted-foreground">
                                    Please enter the administrator password to continue.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Enter password"
                                    autoFocus
                                />
                                {error && (
                                    <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                                        {error}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !password}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Access Admin Panel'
                                )}
                            </button>
                        </form>
                    ) : (
                        <DataUpload />
                    )}
                </div>
            </div>
        </div>
    );
}
