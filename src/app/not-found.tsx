import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="glass max-w-sm p-8 text-center">
        <p className="text-sm font-medium text-accent">404</p>
        <h1 className="mt-2 text-xl font-semibold">Not found</h1>
        <p className="mt-2 text-sm text-muted">This page or video does not exist, or it is not yours.</p>
        <Link href="/videos" className="btn btn-primary mt-6">
          Back to library
        </Link>
      </div>
    </main>
  );
}
