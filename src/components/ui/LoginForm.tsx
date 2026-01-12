import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Input } from './Input';
import { Button } from './Button';

interface LoginFormProps {
    title?: string;
    description?: string;
    onSuccess?: () => void;
}

export function LoginForm({
    title = "Authentication Required",
    description = "Please enter the password to continue.",
    onSuccess
}: LoginFormProps) {
    const { login } = useStore();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const success = await login(password);

        if (success) {
            onSuccess?.();
        } else {
            setError('Invalid password');
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full p-4">
            <div className="text-center space-y-2">
                <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <div className="space-y-2">
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoFocus
                    className={error ? "border-destructive" : ""}
                />
                {error && (
                    <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                        {error}
                    </p>
                )}
            </div>

            <Button
                type="submit"
                disabled={isLoading || !password}
                className="w-full"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                    </>
                ) : (
                    'Access'
                )}
            </Button>
        </form>
    );
}
