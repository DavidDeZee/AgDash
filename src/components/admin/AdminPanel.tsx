
import { DataUpload } from './DataUpload';
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { LoginForm } from '../ui/LoginForm';

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
    const { isAuthenticated } = useStore();

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
                        <LoginForm
                            title="Authentication Required"
                            description="Please enter the administrator password to continue."
                        />
                    ) : (
                        <DataUpload />
                    )}
                </div>
            </div>
        </div>
    );
}

