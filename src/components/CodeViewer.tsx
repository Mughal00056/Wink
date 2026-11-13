import { Check, Columns2, Copy, Download, FileImage } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ConvertedFile, SourceFile } from '../types/converter';
import { downloadSingleOutputFile, formatBytes } from '../utils/zipConverter';

interface CodeViewerProps {
  activeFile: ConvertedFile | SourceFile | null;
  activeOriginSource: SourceFile | null;
  isOutputMode: boolean;
}

function renderLines(content: string) {
  const lines = content.split('\n');
  return (
    <table className="w-full border-collapse font-mono text-[12.5px] leading-relaxed">
      <tbody>
        {lines.map((line, index) => (
          <tr key={index} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40">
            <td className="w-12 select-none border-r border-slate-200 pr-3 pl-3 text-right text-[11px] text-slate-400 tabular-nums dark:border-slate-800 dark:text-slate-600">
              {index + 1}
            </td>
            <td className="px-4 whitespace-pre text-slate-800 dark:text-slate-200">
              {line || ' '}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CodeViewer({ activeFile, activeOriginSource, isOutputMode }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [activeFile?.path]);

  const binaryPreviewUrl = useMemo(() => {
    if (!activeFile?.binaryData) return null;
    const blob = new Blob([new Uint8Array(activeFile.binaryData)], { type: activeFile.mimeType });
    return URL.createObjectURL(blob);
  }, [activeFile]);

  useEffect(() => {
    return () => {
      if (binaryPreviewUrl) URL.revokeObjectURL(binaryPreviewUrl);
    };
  }, [binaryPreviewUrl]);

  if (!activeFile) {
    return (
      <div className="flex h-[480px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No file selected</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Choose a file from the explorer on the left to inspect its converted React code.
        </p>
      </div>
    );
  }

  const canCompare = Boolean(
    isOutputMode && activeOriginSource?.textContent && activeFile.textContent
  );

  const handleCopy = async () => {
    if (!activeFile.textContent) return;
    try {
      await navigator.clipboard.writeText(activeFile.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <span className="truncate font-mono font-medium text-slate-900 dark:text-slate-100">
            {activeFile.path}
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
            ·
          </span>
          <span className="shrink-0 text-slate-500 tabular-nums dark:text-slate-400">
            {formatBytes(activeFile.size)}
          </span>
          {activeOriginSource && isOutputMode && (
            <>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                ·
              </span>
              <span className="truncate text-slate-500 dark:text-slate-400">
                From {activeOriginSource.path}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canCompare && (
            <button
              type="button"
              onClick={() => setCompareMode((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                compareMode
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span>{compareMode ? 'Single View' : 'Compare Source'}</span>
            </button>
          )}

          {activeFile.textContent !== undefined && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          {isOutputMode && (
            <button
              type="button"
              onClick={() => downloadSingleOutputFile(activeFile as ConvertedFile)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download File</span>
            </button>
          )}
        </div>
      </div>

      {activeFile.binaryData ? (
        <div className="flex h-[520px] flex-col items-center justify-center gap-4 bg-slate-50/70 p-6 dark:bg-slate-950/60">
          {activeFile.mimeType.startsWith('image/') && binaryPreviewUrl ? (
            <img
              src={binaryPreviewUrl}
              alt={activeFile.name}
              referrerPolicy="no-referrer"
              className="max-h-[360px] max-w-full rounded border border-slate-200 bg-white object-contain p-2 dark:border-slate-800 dark:bg-slate-900"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <FileImage className="h-8 w-8 text-slate-400" />
            </div>
          )}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Binary asset · {activeFile.mimeType} · {formatBytes(activeFile.size)}
          </div>
        </div>
      ) : compareMode && canCompare && activeOriginSource?.textContent ? (
        <div className="grid h-[560px] grid-cols-1 divide-y divide-slate-200 overflow-hidden lg:grid-cols-2 lg:divide-x lg:divide-y-0 dark:divide-slate-800">
          <div className="flex flex-col overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              Original Source · {activeOriginSource.path}
            </div>
            <div className="flex-1 overflow-auto py-2">
              {renderLines(activeOriginSource.textContent)}
            </div>
          </div>
          <div className="flex flex-col overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-1.5 text-[11px] font-medium text-blue-700 dark:border-slate-800 dark:bg-slate-950 dark:text-blue-400">
              Converted React · {activeFile.path}
            </div>
            <div className="flex-1 overflow-auto py-2">
              {renderLines(activeFile.textContent ?? '')}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[560px] overflow-auto py-2">
          {renderLines(activeFile.textContent ?? '')}
        </div>
      )}
    </div>
  );
}
