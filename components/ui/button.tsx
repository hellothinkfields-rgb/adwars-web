import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0392B]/60',
          'disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' && 'bg-[#C0392B] text-white hover:bg-[#a93226]',
          variant === 'outline' && 'border border-white/10 bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/10',
          variant === 'ghost' && 'text-white/50 hover:text-white hover:bg-white/[0.06]',
          size === 'default' && 'px-4 py-2.5 text-sm',
          size === 'sm' && 'px-3 py-1.5 text-xs',
          size === 'lg' && 'px-6 py-3 text-base',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
