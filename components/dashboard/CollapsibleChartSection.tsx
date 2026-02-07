'use client';

/**
 * Collapsible Chart Section Component
 * Defers rendering heavy chart components until user expands the section
 * Improves initial page load performance
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleChartSectionProps {
  title: string;
  description?: string;
  icon?: string;
  linkHref?: string;
  linkText?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleChartSection({
  title,
  description,
  icon,
  linkHref,
  linkText,
  children,
  defaultOpen = false,
}: CollapsibleChartSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-8 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            {icon && <span className="text-lg">{icon}</span>}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <div className="flex items-center gap-1 text-gray-400">
              {isOpen ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>
          </div>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
        {linkHref && linkText && isOpen && (
          <a
            href={linkHref}
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {linkText}
          </a>
        )}
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}
