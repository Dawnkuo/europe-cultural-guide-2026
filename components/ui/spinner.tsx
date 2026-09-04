import { cn } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';

function Spinner({
  className,
  'aria-label': label = 'Loading',
  ...props
}: React.ComponentProps<'svg'>) {
  return (
    <output
      data-slot="spinner"
      aria-label={label}
      className="inline-flex shrink-0"
    >
      <Loader2Icon
        className={cn(
          'size-4 animate-spin motion-reduce:animate-none',
          className,
        )}
        {...props}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </output>
  );
}

export { Spinner };
