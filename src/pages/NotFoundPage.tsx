import { Link } from '@/lib/router';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center animate-fade-in">
      <div className="text-6xl font-bold text-slate-800 font-mono">404</div>
      <div>
        <h2 className="text-lg font-semibold text-slate-200">Page not found</h2>
        <p className="mt-1 text-sm text-slate-500">The page you are looking for does not exist.</p>
      </div>
      <Link to="/">
        <Button variant="primary" size="md">
          Back to overview
        </Button>
      </Link>
    </div>
  );
}
