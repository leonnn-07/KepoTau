export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-[#5b6cff] to-[#a78bfa] shadow-[0_6px_20px_-6px_rgb(124_92_246/0.9)]">
        <svg viewBox="0 0 24 24" className="size-3.5 translate-x-px fill-white" aria-hidden>
          <path d="M7 4.5v15L19.5 12z" />
        </svg>
      </span>
      <span className="text-[1.05rem] font-semibold tracking-tight">Kepotau</span>
    </span>
  );
}
