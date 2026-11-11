import React from 'react';
import { beatDataAttrs, BeatTimingSpec } from '@/lib/scrollBeats';
import { cn } from '@/lib/utils';

export type SoloBeatAlignment =
  | 'intro-bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'lower-left'
  | 'right-mid-low'
  | 'split'
  | 'bottom-center';

export interface SoloBeatStageProps {
  timing: BeatTimingSpec;
  align: SoloBeatAlignment;
  id?: string;
  ariaLabelledBy?: string;
  className?: string;
  children: React.ReactNode;
}

const ALIGNMENT_STAGE_CLASSES: Record<SoloBeatAlignment, string> = {
  'intro-bottom':
    'inset-x-4 bottom-5 mx-auto flex max-w-2xl flex-col items-center text-center md:bottom-[6.5%]',
  left:
    'inset-x-4 bottom-5 max-w-[420px] md:inset-x-auto md:bottom-auto md:left-6 md:top-1/2 md:w-[310px] md:-translate-y-1/2 lg:left-10 lg:w-[340px] xl:left-12 xl:w-[360px]',
  right:
    'inset-x-4 bottom-5 ml-auto max-w-[420px] md:inset-x-auto md:bottom-auto md:right-5 md:top-1/2 md:w-[270px] md:-translate-y-1/2 lg:right-8 lg:w-[295px] xl:right-10 xl:w-[315px]',
  'top-left':
    'inset-x-4 bottom-5 max-w-[420px] md:inset-x-auto md:bottom-auto md:left-5 md:top-[13%] md:w-[325px] lg:left-9 lg:w-[355px]',
  'lower-left':
    'inset-x-4 bottom-5 max-w-[430px] md:inset-x-auto md:bottom-[7.5%] md:left-6 md:w-[410px] lg:left-10 lg:w-[440px]',
  'right-mid-low':
    'inset-x-4 bottom-5 ml-auto max-w-[420px] md:inset-x-auto md:bottom-[7.5%] md:right-5 md:w-[305px] lg:right-10 lg:w-[335px]',
  split:
    'inset-x-3 bottom-3 flex flex-col gap-2 md:inset-x-5 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:flex-row md:items-center md:justify-between md:gap-4 lg:inset-x-9 xl:inset-x-12',
  'bottom-center':
    'inset-x-4 bottom-4 mx-auto flex max-w-2xl flex-col items-center text-center md:bottom-[4%]',
};

const DATA_ALIGN_SIDE: Record<SoloBeatAlignment, string> = {
  'intro-bottom': 'bottom',
  left: 'left',
  right: 'right',
  'top-left': 'left',
  'lower-left': 'left',
  'right-mid-low': 'right',
  split: 'split',
  'bottom-center': 'bottom',
};

/**
 * Choreography container synchronizing typography layers cleanly to video timestamps
 * and spatial hand gestures with zero box clutter over the subject center column.
 */
export const SoloBeatStage: React.FC<SoloBeatStageProps> = ({
  timing,
  align,
  id,
  ariaLabelledBy,
  className,
  children,
}) => {
  const attrs = beatDataAttrs(timing);

  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      {...attrs}
      data-align={DATA_ALIGN_SIDE[align]}
      className={cn(
        'cinema-perspective-stage pointer-events-none fixed inset-0 z-20 overflow-hidden',
        className
      )}
    >
      <div
        data-beat-stage="true"
        className={cn(
          'cinema-flank-container absolute',
          ALIGNMENT_STAGE_CLASSES[align]
        )}
      >
        {align === 'split' ? (
          children
        ) : (
          <div className="pointer-events-auto">{children}</div>
        )}
      </div>
    </section>
  );
};
