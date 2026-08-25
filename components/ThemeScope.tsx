import type { ReactNode } from "react";
import type { z } from "zod";
import type { ThemeSchema } from "@/lib/contract";

type Theme = z.infer<typeof ThemeSchema>;

export interface ThemeScopeProps {
  /** `theme` straight off the resolved Screen. Optional so a malformed or
   *  half-built config degrades to the default theme instead of throwing,
   *  per the renderer's "never crash the page" rule. */
  theme?: Theme;
  /** Aurora ships dark and light. Dark is the default and the intended
   *  look; pass "light" if an audience expects it. Not part of the
   *  contract, so it stays a local prop rather than a config value. */
  mode?: "dark" | "light";
  className?: string;
  children: ReactNode;
}

/**
 * Turns `screen.theme` into the data attributes app/globals.css themes
 * against. This is the piece REMAINING-WORK.md lists as missing for
 * chunk 9.
 *
 * Deliberately not inline styles. Keeping the values in CSS means the
 * accents live next to each other where they can be compared and contrast
 * checked, and a designer can retune a palette without touching
 * TypeScript. The wrapper only carries which theme is active, never what
 * it looks like.
 *
 * Note the accent default is "gold", Aurora's signature, which is not yet
 * in ThemeSchema's enum. Existing configs selecting teal, navy or plum
 * keep working unchanged; add "gold" to the enum when you want a config
 * to ask for it by name.
 *
 *   <ThemeScope theme={screen.theme}>
 *     {screen.slots.map(renderSlot)}
 *   </ThemeScope>
 */
export function ThemeScope({
  theme,
  mode = "dark",
  className,
  children,
}: ThemeScopeProps) {
  return (
    <div
      data-mode={mode}
      data-accent={theme?.accent ?? "gold"}
      data-density={theme?.density ?? "comfortable"}
      data-scale={theme?.scale ?? "md"}
      className={className}
    >
      {children}
    </div>
  );
}
