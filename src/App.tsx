import {
  AlertCircle,
  Download,
  FileArchive,
  Moon,
  Sun,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CodeViewer } from './components/CodeViewer';
import { DiagnosticsTable } from './components/DiagnosticsTable';
import { ExportGuideView } from './components/ExportGuideView';
import { FileTree } from './components/FileTree';
import { LivePreview } from './components/LivePreview';
import type {
  ConversionOptions,
  ConversionResult,
  ConvertedFile,
  SourceFile,
} from './types/converter';
import { createSampleZipBuffer, SAMPLE_TEMPLATES } from './utils/sampleZips';
import {
  convertZipBufferToReact,
  exportReactProjectZip,
  formatBytes,
} from './utils/zipConverter';

type WorkspaceTab = 'code' | 'preview' | 'diagnostics' | 'guide';

const DEFAULT_OPTIONS: ConversionOptions = {
  language: 'tsx',
  splitSections: true,
  convertSvgs: true,
  includeScaffold: true,
  preserveComments: true,
};

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('code');
  const [options, setOptions] = useState<ConversionOptions>(DEFAULT_OPTIONS);

  const [loadedArchive, setLoadedArchive] = useState<{
    buffer: ArrayBuffer;
    fileName: string;
    sampleId?: string;
  } | null>(null);

  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [treeMode, setTreeMode] = useState<'output' | 'source'>('output');
  const [selectedPath, setSelectedPath] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  const runConversion = useCallback(
    async (buffer: ArrayBuffer, fileName: string, opts: ConversionOptions) => {
      setIsConverting(true);
      setErrorMessage(null);
      try {
        const converted = await convertZipBufferToReact(buffer, fileName, opts);
        setResult(converted);
        setTreeMode('output');

        // Select App.tsx / App.jsx or first page by default
        const preferred =
          converted.outputFiles.find((f) => f.path === `src/App.${opts.language}`) ??
          converted.outputFiles.find((f) => f.path.startsWith('src/pages/')) ??
          converted.outputFiles[0];
        setSelectedPath(preferred?.path ?? '');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to parse the selected ZIP archive.';
        setErrorMessage(message);
      } finally {
        setIsConverting(false);
      }
    },
    []
  );

  // Load initial sample ZIP archive on first mount
  useEffect(() => {
    let cancelled = false;
    async function initSample() {
      try {
        const sample = await createSampleZipBuffer('studio-landing');
        if (cancelled) return;
        setLoadedArchive({
          buffer: sample.buffer,
          fileName: sample.fileName,
          sampleId: 'studio-landing',
        });
        await runConversion(sample.buffer, sample.fileName, DEFAULT_OPTIONS);
      } catch {
        if (!cancelled) {
          setErrorMessage('Failed to initialize workspace sample archive.');
          setIsConverting(false);
        }
      }
    }
    initSample();
    return () => {
      cancelled = true;
    };
  }, [runConversion]);

  // Re-run conversion automatically when options change
  const updateOptions = (patch: Partial<ConversionOptions>) => {
    const next = { ...options, ...patch };
    setOptions(next);
    if (loadedArchive) {
      void runConversion(loadedArchive.buffer, loadedArchive.fileName, next);
    }
  };

  const handleFileSelected = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setErrorMessage(`"${file.name}" is not a .zip archive. Please upload a valid .zip file.`);
      return;
    }
    const buffer = await file.arrayBuffer();
    setLoadedArchive({ buffer, fileName: file.name });
    await runConversion(buffer, file.name, options);
  };

  const handleSelectSample = async (templateId: string) => {
    setIsConverting(true);
    setErrorMessage(null);
    try {
      const sample = await createSampleZipBuffer(templateId);
      setLoadedArchive({
        buffer: sample.buffer,
        fileName: sample.fileName,
        sampleId: templateId,
      });
      await runConversion(sample.buffer, sample.fileName, options);
    } catch {
      setErrorMessage('Unable to generate sample archive.');
      setIsConverting(false);
    }
  };

  const handleDownloadSampleInputZip = async (templateId: string) => {
    const sample = await createSampleZipBuffer(templateId);
    const blob = new Blob([sample.buffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sample.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadReactZip = async () => {
    if (!result) return;
    await exportReactProjectZip(result);
  };

  const activeFile: ConvertedFile | SourceFile | null = useMemo(() => {
    if (!result) return null;
    if (treeMode === 'output') {
      return result.outputFiles.find((f) => f.path === selectedPath) ?? result.outputFiles[0] ?? null;
    }
    return result.sourceFiles.find((f) => f.path === selectedPath) ?? result.sourceFiles[0] ?? null;
  }, [result, treeMode, selectedPath]);

  const activeOriginSource: SourceFile | null = useMemo(() => {
    if (!result || treeMode !== 'output' || !activeFile) return null;
    const outputFile = activeFile as ConvertedFile;
    if (!outputFile.sourceOrigin) return null;
    return result.sourceFiles.find((sf) => sf.path === outputFile.sourceOrigin) ?? null;
  }, [result, treeMode, activeFile]);

  const handleSelectTreePath = (path: string, mode: 'output' | 'source') => {
    setTreeMode(mode);
    setSelectedPath(path);
    setActiveTab('code');
  };

  const handleInspectDiagnosticOutput = (outputPath: string) => {
    setTreeMode('output');
    setSelectedPath(outputPath);
    setActiveTab('code');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('code');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 dark:text-slate-100"
          >
            ZipReact
          </a>

          {/* Zone 2: 4 single-line text nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
                activeTab === 'code' ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600 dark:text-slate-100' : ''
              }`}
            >
              Code Output
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
                activeTab === 'preview' ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600 dark:text-slate-100' : ''
              }`}
            >
              Live Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('diagnostics')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
                activeTab === 'diagnostics' ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600 dark:text-slate-100' : ''
              }`}
            >
              Diagnostics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
                activeTab === 'guide' ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-blue-600 dark:text-slate-100' : ''
              }`}
            >
              Export Guide
            </button>
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              disabled={!result || isConverting}
              onClick={handleDownloadReactZip}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download React ZIP</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workbench Layout */}
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
        {/* Left Sidebar (280px) */}
        <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-[280px]">
          {/* Dropzone & Upload */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFileSelected(file);
            }}
            className={`flex flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition-colors ${
              isDragging
                ? 'border-blue-600 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-950/30'
                : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
            }`}
          >
            <Upload className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Drop a .zip archive
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              HTML, CSS, SVG, JS, and media assets converted directly in your browser.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileSelected(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 whitespace-nowrap transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <FileArchive className="h-3.5 w-3.5" />
              <span>Choose ZIP File</span>
            </button>
          </div>

          {/* Sample Templates */}
          <div className="flex flex-col gap-2.5 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Sample Archives
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {SAMPLE_TEMPLATES.map((tpl) => {
                const isActive = loadedArchive?.sampleId === tpl.id;
                return (
                  <div key={tpl.id} className="flex items-start justify-between gap-2 py-2.5 first:pt-1 last:pb-0">
                    <button
                      type="button"
                      onClick={() => void handleSelectSample(tpl.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div
                        className={`truncate text-xs font-medium ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-800 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400'
                        }`}
                      >
                        {tpl.name}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {tpl.archiveName} · {tpl.fileCountHint}
                      </div>
                    </button>
                    <button
                      type="button"
                      title={`Download ${tpl.archiveName}`}
                      aria-label={`Download ${tpl.archiveName}`}
                      onClick={() => void handleDownloadSampleInputZip(tpl.id)}
                      className="mt-0.5 shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conversion Options */}
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Compiler Options
            </h2>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400">Target Syntax</span>
              <div className="flex items-center gap-1 rounded-md bg-slate-100 p-0.5 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => updateOptions({ language: 'tsx' })}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    options.language === 'tsx'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  TSX
                </button>
                <button
                  type="button"
                  onClick={() => updateOptions({ language: 'jsx' })}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    options.language === 'jsx'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  JSX
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300">
              <span>Split Semantic Sections</span>
              <input
                type="checkbox"
                checked={options.splitSections}
                onChange={(e) => updateOptions({ splitSections: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300">
              <span>SVG to Icon Components</span>
              <input
                type="checkbox"
                checked={options.convertSvgs}
                onChange={(e) => updateOptions({ convertSvgs: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300">
              <span>Include Vite Scaffold</span>
              <input
                type="checkbox"
                checked={options.includeScaffold}
                onChange={(e) => updateOptions({ includeScaffold: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300">
              <span>Preserve HTML Comments</span>
              <input
                type="checkbox"
                checked={options.preserveComments}
                onChange={(e) => updateOptions({ preserveComments: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Explorer */}
          {result && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <FileTree
                mode={treeMode}
                onModeChange={(nextMode) => {
                  setTreeMode(nextMode);
                  const first =
                    nextMode === 'output'
                      ? result.outputFiles[0]?.path
                      : result.sourceFiles[0]?.path;
                  if (first) setSelectedPath(first);
                }}
                outputFiles={result.outputFiles}
                sourceFiles={result.sourceFiles}
                selectedPath={selectedPath}
                onSelectPath={handleSelectTreePath}
              />
            </div>
          )}
        </aside>

        {/* Main Content Viewport */}
        <main className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Contextual Workspace Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Projects</span>
                <span aria-hidden="true">/</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {result ? result.archiveFileName : 'Loading archive'}
                </span>
              </div>
              {result && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums dark:text-slate-400">
                  <span>{result.stats.sourceFileCount} source files</span>
                  <span aria-hidden="true">·</span>
                  <span>{result.stats.outputFileCount} React files</span>
                  <span aria-hidden="true">·</span>
                  <span>{result.stats.componentCount} components</span>
                  <span aria-hidden="true">·</span>
                  <span>{result.stats.attributesTransformed} JSX attributes converted</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatBytes(result.stats.totalOutputBytes)} total</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 md:hidden dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                    activeTab === 'code'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Code
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                    activeTab === 'preview'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('diagnostics')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                    activeTab === 'diagnostics'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Logs
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span>{darkMode ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <span className="font-semibold">Conversion Error: </span>
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="font-medium underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Loading State */}
          {isConverting && (
            <div className="flex h-[560px] flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
              <div className="h-3 w-4/6 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>
          )}

          {/* Active Workspace Content */}
          {!isConverting && result && (
            <>
              {activeTab === 'code' && (
                <CodeViewer
                  activeFile={activeFile}
                  activeOriginSource={activeOriginSource}
                  isOutputMode={treeMode === 'output'}
                />
              )}

              {activeTab === 'preview' && <LivePreview pages={result.previewPages} />}

              {activeTab === 'diagnostics' && (
                <DiagnosticsTable
                  diagnostics={result.diagnostics}
                  onInspectOutputPath={handleInspectDiagnosticOutput}
                />
              )}

              {activeTab === 'guide' && (
                <ExportGuideView
                  result={result}
                  language={options.language}
                  onDownloadZip={handleDownloadReactZip}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
