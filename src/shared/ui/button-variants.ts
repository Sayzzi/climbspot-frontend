import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        /* Signpost yellow: the one main action of a screen. */
        primary: 'bg-signpost font-semibold text-pine shadow-sm hover:bg-signpost/85',
        secondary: 'border border-pine/20 bg-white text-pine hover:bg-lichen',
        ghost: 'text-pine hover:bg-pine/5',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
