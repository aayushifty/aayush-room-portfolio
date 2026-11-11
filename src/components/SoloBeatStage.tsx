import React from 'react';
import { beatDataAttrs, BeatTimingSpec } from '@/lib/scrollBeats';
import { cn } from '@/lib/utils';

export interface SoloBeatStageProps {
  timing: BeatTimingSpec;
  align: 'left' | 'right' | 'center';
  vertical?: 'end' | 'center';
  bottomInset?: boolean;
  id?: string;
  ariaLabelledBy?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Renders strictly ONE single unboxed content block at a time on either the left flank,
 * right flank, or center finale with unified physics-spring stage choreography.
 */
export const SoloBeatStage: React.FC<SoloBeatStageProps> = ({
  timing,
  align,
  vertical = 'center',
  bottomInset = false,
  id,
  ariaLabelledBy,
  className,
  children,
}) => {
  const alignClass =
    align === 'right'
      ? 'justify-end'
      : align === 'center'
        ? 'justify-center'
        : 'justify-start';

  const verticalClass = vertical === 'end' ? 'items-end' : 'items-center';

  const padBottomClass =
    bottomInset
      ? 'pb-20 sm:pb-24'
      : vertical === 'end'
        ? 'pb-8 sm:pb-14'
        : 'pb-8 sm:pb-10';

  return (
    <div
      id={id}
      aria-labelledby={ariaLabelledBy}
      data-align={align}
      {...beatDataAttrs(timing)}
      className={cn(
        'absolute inset-0 flex px-5 pt-20 sm:px-10 lg:px-14',
        verticalClass,
        padBottomClass,
        className
      )}
    >
      {/* Seamless open atmospheric veil — zero visible box boundaries */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0',
          align === 'left' &&
            'bg-[linear-gradient(90deg,rgba(6,8,13,0.58)_0%,rgba(6,8,13,0.28)_32%,rgba(6,8,13,0)_56%)] max-sm:bg-[linear-gradient(0deg,rgba(6,8,13,0.78)_0%,rgba(6,8,13,0.36)_46%,rgba(6,8,13,0)_76%)]',
          align === 'right' &&
            'bg-[linear-gradient(270deg,rgba(6,8,13,0.58)_0%,rgba(6,8,13,0.28)_32%,rgba(6,8,13,0)_56%)] max-sm:bg-[linear-gradient(0deg,rgba(6,8,13,0.78)_0%,rgba(6,8,13,0.36)_46%,rgba(6,8,13,0)_76%)]',
          align === 'center' &&
            'bg-[radial-gradient(ellipse_78%_68%_at_50%_50%,rgba(6,8,13,0.76)_0%,rgba(6,8,13,0.42)_54%,rgba(6,8,13,0)_100%)]'
        )}
      />

      <div className={cn('relative z-10 mx-auto flex w-full max-w-[1440px]', alignClass)}>
        {align === 'center' ? (
          <div data-beat-stage="true" className="cinema-flank-container w-full max-w-4xl">
            {children}
          </div>
        ) : (
          <div
            data-beat-stage="true"
            className="cinema-flank-container w-full max-w-[460px] sm:max-w-[520px]"
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
