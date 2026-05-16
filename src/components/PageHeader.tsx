import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between border-b px-8 py-5">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}

export function NewButton({ to, params }: { to: string; params?: Record<string, string> }) {
  return (
    <Button asChild size="sm">
      <Link to={to as never} params={params as never}>
        <Plus className="mr-1 h-3.5 w-3.5" /> New
      </Link>
    </Button>
  );
}

export function EmptyState({ msg }: { msg: string }) {
  return <div className="rounded-md border border-dashed py-12 text-center text-sm text-muted-foreground">{msg}</div>;
}
