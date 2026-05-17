"use client";

import { useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 w-64 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg border border-white/20 -top-2 left-full ml-2">
          <div className="absolute w-2 h-2 bg-gray-900 border-l border-t border-white/20 transform rotate-45 -left-1 top-3" />
          {content}
        </div>
      )}
    </div>
  );
}

interface InfoIconProps {
  tooltip: string;
}

export function InfoIcon({ tooltip }: InfoIconProps) {
  return (
    <Tooltip content={tooltip}>
      <span className="inline-flex items-center justify-center w-4 h-4 text-xs text-white/50 hover:text-white/80 transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </Tooltip>
  );
}

interface HelpTextProps {
  children: React.ReactNode;
  className?: string;
}

export function HelpText({ children, className = "" }: HelpTextProps) {
  return (
    <div className={`rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-sky-300 ${className}`}>
      <div className="flex gap-2">
        <span className="shrink-0">💡</span>
        <div>{children}</div>
      </div>
    </div>
  );
}

interface WarningTextProps {
  children: React.ReactNode;
  className?: string;
}

export function WarningText({ children, className = "" }: WarningTextProps) {
  return (
    <div className={`rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300 ${className}`}>
      <div className="flex gap-2">
        <span className="shrink-0">⚠️</span>
        <div>{children}</div>
      </div>
    </div>
  );
}

interface GlossaryTermProps {
  term: string;
  definition: string;
  children: React.ReactNode;
}

export function GlossaryTerm({ term, definition, children }: GlossaryTermProps) {
  return (
    <Tooltip content={`${term}: ${definition}`}>
      <span className="border-b border-dotted border-white/30 cursor-help">
        {children}
      </span>
    </Tooltip>
  );
}
