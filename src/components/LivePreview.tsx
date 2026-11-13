import { Monitor, RotateCw, Smartphone, Tablet } from 'lucide-react';
import { useState } from 'react';
import type { PreviewPage } from '../types/converter';

interface LivePreviewProps {
  pages: PreviewPage[];
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

export function LivePreview({ pages }: LivePreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [reloadNonce, setReloadNonce] = useState(0);

  if (pages.length === 0) {
    return (
      <div className="flex h-[560px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No HTML entry pages detected</p>
        <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
          This ZIP archive contains assets or standalone SVG files without an HTML page. Inspect the generated React components in Code Output.
        </p>
      </div>
    );
  }

  const safeIndex = selectedIndex < pages.length ? selectedIndex : 0;
  const activePage = pages[safeIndex];

  const frameWidth =
    viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '390px';

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto">
          {pages.length > 1 ? (
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/80">
              {pages.map((page, idx) => (
                <button
                  key={page.sourcePath}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                    idx === safeIndex
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {page.componentName} ({page.sourcePath})
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-900 dark:text-slate-100">{activePage.title}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{activePage.sourcePath}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title="Desktop viewport"
              aria-label="Desktop viewport"
              className={`rounded-md p-1.5 transition-colors ${
                viewport === 'desktop'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              title="Tablet viewport (768px)"
              aria-label="Tablet viewport"
              className={`rounded-md p-1.5 transition-colors ${
                viewport === 'tablet'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title="Mobile viewport (390px)"
              aria-label="Mobile viewport"
              className={`rounded-md p-1.5 transition-colors ${
                viewport === 'mobile'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setReloadNonce((n) => n + 1)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Reload</span>
          </button>
        </div>
      </div>

      <div className="flex h-[560px] justify-center overflow-auto bg-slate-100 p-4 dark:bg-slate-950">
        <iframe
          key={`${activePage.sourcePath}-${reloadNonce}`}
          title={`Preview of ${activePage.title}`}
          srcDoc={activePage.htmlDocument}
          sandbox="allow-same-origin"
          style={{ width: frameWidth }}
          className="h-full max-w-full rounded border border-slate-200 bg-white transition-[width] duration-200 dark:border-slate-800"
        />
      </div>
    </div>
  );
}
