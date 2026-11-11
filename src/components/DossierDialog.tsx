import React, { useEffect, useRef } from 'react';
import { X, ArrowUpRight, Github, ShieldCheck, Cpu, Award } from 'lucide-react';
import { CredentialItem, ProjectItem } from '@/data/portfolio';

export type DossierSelection =
  | { kind: 'project'; item: ProjectItem }
  | { kind: 'credential'; item: CredentialItem }
  | null;

export interface DossierDialogProps {
  selection: DossierSelection;
  onClose: () => void;
}

export const DossierDialog: React.FC<DossierDialogProps> = ({ selection, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (selection) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [selection]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>): void => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-labelledby="dossier-title"
      className="dossier-dialog m-auto max-h-[86dvh] w-[min(92vw,720px)] overflow-y-auto rounded-2xl border-0 bg-[#070a11]/95 p-0 text-slate-100 shadow-2xl"
    >
      {selection && (
        <div className="p-6 sm:p-9">
          <div className="flex items-start justify-between gap-4 pb-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 font-mono-tech text-xs uppercase tracking-[0.18em] text-[#e8c589]">
                {selection.kind === 'project' ? (
                  <>
                    <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{selection.item.category} · {selection.item.year}</span>
                  </>
                ) : (
                  <>
                    <Award className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{selection.item.category} · {selection.item.year}</span>
                  </>
                )}
              </div>
              <h2
                id="dossier-title"
                className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
              >
                {selection.item.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-300">
                {selection.kind === 'project'
                  ? selection.item.subtitle
                  : selection.item.issuer}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dossier"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-slate-300 transition hover:text-[#e8c589]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-2 space-y-6">
            <div className="inline-flex items-center gap-2 font-mono-tech text-xs font-medium text-teal-300">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {selection.kind === 'project'
                  ? selection.item.highlightMetric
                  : selection.item.badge}
              </span>
            </div>

            <p className="text-base leading-relaxed text-slate-200">
              {selection.item.summary}
            </p>

            <div>
              <h3 className="mb-3 font-mono-tech text-xs font-semibold uppercase tracking-widest text-slate-400">
                {selection.kind === 'project'
                  ? 'Architecture & Key Engineering Highlights'
                  : 'Verified Record & Distinction'}
              </h3>
              <ul className="space-y-2.5 text-sm leading-relaxed text-slate-300">
                {(selection.kind === 'project'
                  ? selection.item.architectureNotes
                  : selection.item.details
                ).map((note, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e8c589]"
                    />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selection.kind === 'credential' && selection.item.signatories && (
              <div className="text-sm text-[#e8c589]/90">
                <span className="block font-mono-tech text-xs uppercase tracking-wider text-[#e8c589]">
                  Official Endorsement
                </span>
                <p className="mt-1 leading-relaxed text-slate-200">{selection.item.signatories}</p>
              </div>
            )}

            {selection.kind === 'project' &&
              (selection.item.githubUrl || selection.item.liveUrl) && (
                <div className="flex flex-wrap gap-6 pt-2">
                  {selection.item.liveUrl && (
                    <a
                      href={selection.item.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cinema-link-action font-kicker text-xs font-semibold uppercase tracking-[0.16em] text-[#e8c589] hover:text-white"
                    >
                      <span>Launch Live Experience</span>
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                  {selection.item.githubUrl && (
                    <a
                      href={selection.item.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cinema-link-action font-kicker text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 hover:text-[#e8c589]"
                    >
                      <Github className="h-4 w-4" aria-hidden="true" />
                      <span>Inspect Repository</span>
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}
          </div>
        </div>
      )}
    </dialog>
  );
};
