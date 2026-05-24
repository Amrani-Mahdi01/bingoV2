import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

/**
 * Horizontal-only slider. Earlier revisions relied on Tailwind's
 * `data-horizontal:` attribute selectors, which weren't matching how
 * @base-ui emits its data props in this version — the result was a
 * track with zero height (invisible) and thumbs floating on nothing.
 *
 * This version hard-codes the horizontal layout. If we ever need a
 * vertical slider, we can re-introduce variants then.
 */
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("w-full", className)}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex h-5 w-full touch-none select-none items-center">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-wood-200"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="absolute h-full bg-tangerine-500"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className={cn(
              "relative block size-5 shrink-0 rounded-full border-2 border-tangerine-500 bg-cream shadow-sm",
              "transition-transform select-none",
              "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tangerine-500/40",
              "active:scale-110 disabled:pointer-events-none disabled:opacity-50",
              "after:absolute after:-inset-2"
            )}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
