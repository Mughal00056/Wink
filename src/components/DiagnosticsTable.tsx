import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import type { DiagnosticEntry } from '../types/converter';

interface DiagnosticsTableProps {
  diagnostics: DiagnosticEntry[];
  onInspectOutputPath: (outputPath: string) => void;
}

export function DiagnosticsTable({ diagnostics, onInspectOutputPath }: DiagnosticsTableProps) {
  const [filter, setFilter] = useState<'all' | 'converted' | 'warning'>('all');

  const filtered = diagnostics.filter((d) => {
    if (filter === 'all') return true;
    return d.severity === filter;
  });

  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            Transformation Log
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{diagnostics.length} operations</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{warningCount} review notices</span>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            All ({diagnostics.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('converted')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              filter === 'converted'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Converted
          </button>
          <button
            type="button"
            onClick={() => setFilter('warning')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              filter === 'warning'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Needs Review ({warningCount})
          </button>
        </div>
      </div>

      <div className="max-h-[560px] overflow-auto">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
            No transformation entries match this filter.
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 text-[11px] font-medium text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Source File</th>
                <th className="px-4 py-2.5">React Output</th>
                <th className="px-4 py-2.5 text-right">JSX Attrs</th>
                <th className="px-4 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {entry.severity === 'warning' ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>Review</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{entry.action}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {entry.sourcePath}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => onInspectOutputPath(entry.outputPath)}
                      className="font-mono text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {entry.outputPath}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {entry.attributesTransformed}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                    {entry.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
