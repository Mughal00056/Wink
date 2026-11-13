import { Check, Copy, Download, Terminal } from 'lucide-react';
import { useState } from 'react';
import type { ConversionResult, TargetLanguage } from '../types/converter';

interface ExportGuideViewProps {
  result: ConversionResult;
  language: TargetLanguage;
  onDownloadZip: () => void;
}

export function ExportGuideView({ result, language, onDownloadZip }: ExportGuideViewProps) {
  const [copiedCmd, setCopiedCmd] = useState(false);

  const commands = `unzip ${result.projectName}-react.zip -d ${result.projectName}\ncd ${result.projectName}\nnpm install\nnpm run dev`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commands);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 1800);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Run {result.projectName} Locally
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Exported archives include a complete Vite + React {language.toUpperCase()} project with all converted components, styles, and public assets.
          </p>
        </div>
        <button
          type="button"
          onClick={onDownloadZip}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap transition-colors hover:bg-blue-700"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download {result.projectName}-react.zip</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
              <Terminal className="h-3.5 w-3.5 text-slate-500" />
              <span>01. Install &amp; Start Development Server</span>
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {copiedCmd ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedCmd ? 'Copied commands' : 'Copy commands'}</span>
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {commands}
          </pre>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            02. What Was Automated
          </span>
          <ul className="divide-y divide-slate-200 border-y border-slate-200 text-xs text-slate-600 dark:divide-slate-800 dark:border-slate-800 dark:text-slate-400">
            <li className="flex items-center justify-between py-2.5">
              <span>HTML &amp; SVG attributes mapped to React JSX</span>
              <span className="font-mono font-medium text-slate-900 tabular-nums dark:text-slate-100">
                {result.stats.attributesTransformed} transforms
              </span>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <span>React page &amp; section components generated</span>
              <span className="font-mono font-medium text-slate-900 tabular-nums dark:text-slate-100">
                {result.stats.componentCount} files
              </span>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <span>Standalone SVG icons converted to components</span>
              <span className="font-mono font-medium text-slate-900 tabular-nums dark:text-slate-100">
                {result.stats.svgIconCount} icons
              </span>
            </li>
            <li className="flex items-center justify-between py-2.5">
              <span>Stylesheets &amp; static public assets preserved</span>
              <span className="font-mono font-medium text-slate-900 tabular-nums dark:text-slate-100">
                {result.stats.stylesheetCount + result.stats.assetCount} files
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
