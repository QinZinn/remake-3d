export function ArrowRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className={className}>
      <path d="M2.5 8h10.5M9 3.75 13.25 8 9 12.25" />
    </svg>
  );
}

export function ArrowLeftIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className={className}>
      <path d="M13.5 8H3M7 3.75 2.75 8 7 12.25" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className={className}>
      <path d="M4 12 12 4M5.5 4H12v6.5" />
    </svg>
  );
}

export function PlusIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" aria-hidden="true" className={className}>
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

export function CloseIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" aria-hidden="true" className={className}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function CheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className={className}>
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

export function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className={className}>
      <circle cx="7" cy="7" r="4.75" />
      <path d="m10.75 10.75 3 3" />
    </svg>
  );
}

export function CameraIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className={className}>
      <path d="M2 5.25h2.5l1-1.75h5l1 1.75H14v7.5H2v-7.5Z" />
      <circle cx="8" cy="8.75" r="2.25" />
    </svg>
  );
}

export function UploadImageIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className={className}>
      <rect x="2" y="2.5" width="12" height="11" />
      <circle cx="5.5" cy="6" r="1.1" />
      <path d="M2.5 11.5 6 8l2.5 2.25L11 7.75l2.5 3.75" />
    </svg>
  );
}

export function ViewfinderIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true" className={className}>
      <path d="M2.5 5.5v-3h3M10.5 2.5h3v3M13.5 10.5v3h-3M5.5 13.5h-3v-3" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

export function WarningIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className={className}>
      <path d="M8 2.25 14 13H2L8 2.25Z" />
      <path d="M8 6.25v3.25M8 11.25h.01" />
    </svg>
  );
}

export function TipIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className={className}>
      <path d="M5.75 11.5h4.5M6.25 13.5h3.5M8 2.25a3.75 3.75 0 0 0-2.1 6.85c.45.32.7.78.75 1.4h2.7c.05-.62.3-1.08.75-1.4A3.75 3.75 0 0 0 8 2.25Z" />
    </svg>
  );
}

export function BrandMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={className}>
      <path d="M14 2.5 24 8.25v11.5L14 25.5 4 19.75V8.25L14 2.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="miter" />
      <path d="M14 14v11.5M14 14 24 8.25M14 14 4 8.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 12.6 14 17l7.5-4.4" stroke="#BD3B20" strokeWidth="1.8" strokeDasharray="2.5 2" />
    </svg>
  );
}
