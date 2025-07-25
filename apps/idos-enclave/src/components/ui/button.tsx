import type { ButtonHTMLAttributes } from "preact/compat";
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
  base: "inline-flex place-content-center items-center rounded-md px-6 py-3 font-semibold text-neutral-950 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  variants: {
    variant: {
      primary: "bg-green-200 hover:bg-green-400 focus:ring-green-400",
      secondary: "bg-slate-200 hover:bg-slate-400 focus:ring-slate-400",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

type BaseVariants = VariantProps<typeof button>;
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseVariants {}

export function Button({ variant, class: _class, className, ...props }: ButtonProps) {
  return (
    <button
      // @ts-ignore: there is a mismatch between what `preact` types for `class` and what `tailwind-variants` expects.
      className={button({ variant, class: _class, className })}
      {...props}
    />
  );
}
