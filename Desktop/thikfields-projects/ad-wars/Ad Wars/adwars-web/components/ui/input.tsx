import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-white/[0.09] bg-white/[0.04] px-4 py-2.5',
          'text-sm text-white placeholder:text-white/25',
          'outline-none focus:ring-2 focus:ring-[#C0392B]/50 focus:border-[#C0392B]/40',
          'transition-all',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
