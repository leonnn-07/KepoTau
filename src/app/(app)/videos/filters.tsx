"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

type Props = {
  q: string;
  category: string;
  status: string;
  categories: string[];
};

export function Filters({ q, category, status, categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function navigate(next: Partial<Record<"q" | "category" | "status", string>>) {
    const params = new URLSearchParams();
    const merged = { q: query, category, status, ...next };
    if (merged.q.trim()) params.set("q", merged.q.trim());
    if (merged.category) params.set("category", merged.category);
    if (merged.status && merged.status !== "active") params.set("status", merged.status);
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function onQueryChange(value: string) {
    setQuery(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate({ q: value }), 300);
  }

  return (
    <div className="glass mb-6 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search title, caption, #hashtag, notes…"
          aria-label="Search videos"
          className="input pl-9 pr-9"
        />
        {pending ? (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-faint" aria-hidden />
        ) : (
          query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="focus-ring absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-faint hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <select
          value={category}
          onChange={(e) => navigate({ category: e.target.value })}
          aria-label="Filter by category"
          className="input sm:w-44"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => navigate({ status: e.target.value })}
          aria-label="Filter by status"
          className="input sm:w-48"
        >
          <option value="active">Active stock</option>
          <option value="ready">In stock (unposted)</option>
          <option value="partially_posted">Partially posted</option>
          <option value="posted">Posted · deleting soon</option>
          <option value="archived">Archived (file removed)</option>
          <option value="all">Everything</option>
        </select>
      </div>
    </div>
  );
}
