import type { InputHTMLAttributes } from "preact/compat";
import { tv, type VariantProps } from "tailwind-variants";

const textField = tv({
  base: "rounded-md border-2 border-green-400 bg-white font-bold text-neutral-950 text-xl ring-green-400 placeholder:text-neutral-100 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 dark:bg-neutral-950 dark:text-neutral-50 dark:placeholder:font-normal",
});

type TextFieldVariants = VariantProps<typeof textField>;
export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement>, TextFieldVariants {}

export function TextField({ class: class_, className, ...props }: TextFieldProps) {
  return (
    <input
      className={textField({
        // @ts-ignore: there is a mismatch between what `preact` types for `class` and what `tailwind-variants` expects.
        class: class_,
        // @ts-ignore
        className,
      })}
      {...props}
    />
  );
}
