import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  animated?: boolean;
  className?: string;
  showRing?: boolean;
};

/** Circular gradient PixEarn mark. Floats and spins its outer ring when animated. */
export function PixEarnLogo({ size = 96, animated = false, className, showRing = true }: Props) {
  return (
    <div
      className={cn("relative grid place-items-center", animated && "pixearn-float", className)}
      style={{ width: size, height: size }}
    >
      {showRing && (
        <div
          className={cn(
            "absolute inset-0 rounded-full border-[3px] border-transparent",
            "[background:conic-gradient(from_0deg,var(--brand-from),var(--brand-to),var(--brand-from))_border-box]",
            "[mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)]",
            "[mask-composite:exclude]",
            animated && "pixearn-spin",
          )}
        />
      )}
      <div
        className="grid place-items-center rounded-full brand-gradient text-white shadow-lg shadow-indigo-500/25"
        style={{ width: size * 0.82, height: size * 0.82 }}
      >
        <span
          className="font-extrabold tracking-tight leading-none"
          style={{ fontSize: size * 0.185 }}
        >
          PixEarn
        </span>
      </div>
    </div>
  );
}
