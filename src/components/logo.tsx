const VARIANTS = {
  horizontal: { src: "/brand/kepotau-logo-horizontal.svg", width: 1040, height: 300 },
  stacked: { src: "/brand/kepotau-logo-stacked-transparent.svg", width: 1200, height: 1200 },
} as const;

/** KepoTau logo: the curious-sketch mascot with the wordmark. Size it with a height/width class. */
export function Logo({
  variant = "horizontal",
  className = "h-10 w-auto",
}: {
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  const { src, width, height } = VARIANTS[variant];
  // eslint-disable-next-line @next/next/no-img-element -- static vector asset
  return <img src={src} width={width} height={height} alt="KepoTau" className={className} />;
}
