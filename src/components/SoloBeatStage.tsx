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
 * Renders strictly ONE open, unboxed content block at a time on either the left flank,
 * right flank, or centered composition with unified physics-spring choreography.
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
      ? 'pb-16 sm:pb-20'
      : vertical === 'end'
        ? 'pb-5 sm:pb-12'
        : 'pb-8 sm:pb-10';

  return (
    <div
      id={id}
      aria-labelledby={ariaLabelledBy}
      data-align={align}
      {...beatDataAttrs(timing)}
      className={cn(
        'pointer-events-none fixed inset-0 z-20 flex px-5 pt-20 sm:px-10 lg:px-14',
        verticalClass,
        padBottomClass,
        className
      )}
    >
      {/* Seamless open atmospheric veil — zero boxes, borders, or rounded patches */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0',
          align === 'left' &&
            'bg-[linear-gradient(90deg,rgba(6,8,13,0.72)_0%,rgba(6,8,13,0.38)_34%,rgba(6,8,13,0)_56%)] max-sm:bg-[linear-gradient(0deg,rgba(6,8,13,0.84)_0%,rgba(6,8,13,0.44)_48%,rgba(6,8,13,0)_76%)]',
          align === 'right' &&
            'bg-[linear-gradient(270deg,rgba(6,8,13,0.72)_0%,rgba(6,8,13,0.38)_34%,rgba(6,8,13,0)_56%)] max-sm:bg-[linear-gradient(0deg,rgba(6,8,13,0.84)_0%,rgba(6,8,13,0.44)_48%,rgba(6,8,13,0)_76%)]',
          align === 'center' &&
            vertical === 'end' &&
            'bg-[linear-gradient(0deg,rgba(6,8,13,0.92)_0%,rgba(6,8,13,0.68)_34%,rgba(6,8,13,0)_64%)]',
          align === 'center' &&
            vertical !== 'end' &&
            'bg-[radial-gradient(ellipse_78%_68%_at_50%_50%,rgba(6,8,13,0.78)_0%,rgba(6,8,13,0.44)_54%,rgba(6,8,13,0)_100%)]'
        )}
      />

      <div className={cn('relative z-10 mx-auto flex w-full max-w-[1440px]', alignClass)}>
        {align === 'center' ? (
          <div
            data-beat-stage="true"
            className="cinema-flank-container pointer-events-auto w-full max-w-4xl"
          >
            {children}
          </div>
        ) : (
          <div
            data-beat-stage="true"
            className="cinema-flank-container pointer-events-auto w-full max-w-[400px] sm:max-w-[445px]"
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
