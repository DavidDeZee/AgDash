import { Monitor } from 'lucide-react';

export function MobileWarning() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="max-w-md mx-4 p-8 bg-card border-2 border-primary rounded-lg shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-primary/10 rounded-full">
            <Monitor className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            Desktop Required
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            This agricultural dashboard is optimized for desktop viewing.
            Please access this application on a laptop or desktop computer for the best experience.
          </p>
        </div>

        <div className="pt-4 text-sm text-muted-foreground">
          <p>Recommended minimum screen width: <span className="text-primary font-semibold">1024px</span></p>
        </div>
      </div>
    </div>
  );
}
