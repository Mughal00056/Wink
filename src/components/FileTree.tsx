import { ChevronDown, ChevronRight, FileCode2, FileImage, FileJson, FileText, Folder, FolderOpen, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ConvertedFile, SourceFile } from '../types/converter';
import { formatBytes } from '../utils/zipConverter';

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  size?: number;
  kind?: string;
  children: TreeNode[];
}

function buildTree(items: Array<{ path: string; size: number; kind: string }>): TreeNode[] {
  const root: TreeNode[] = [];

  for (const item of items) {
    const parts = item.path.split('/').filter(Boolean);
    let currentLevel = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      let existing = currentLevel.find((n) => n.name === part && n.isFolder === !isLast);
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isFolder: !isLast,
          size: isLast ? item.size : undefined,
          kind: isLast ? item.kind : undefined,
          children: [],
        };
        currentLevel.push(existing);
      }
      currentLevel = existing.children;
    }
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children.length > 0) sortNodes(node.children);
    }
    return nodes;
  };

  return sortNodes(root);
}

function renderFileIcon(kind?: string) {
  if (kind === 'asset' || kind === 'svg') {
    return <FileImage className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />;
  }
  if (kind === 'json') {
    return <FileJson className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />;
  }
  if (kind === 'tsx' || kind === 'jsx' || kind === 'ts' || kind === 'js' || kind === 'html' || kind === 'css') {
    return <FileCode2 className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />;
  }
  return <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />;
}

interface FileTreeProps {
  mode: 'output' | 'source';
  onModeChange: (mode: 'output' | 'source') => void;
  outputFiles: ConvertedFile[];
  sourceFiles: SourceFile[];
  selectedPath: string;
  onSelectPath: (path: string, treeMode: 'output' | 'source') => void;
}

export function FileTree({
  mode,
  onModeChange,
  outputFiles,
  sourceFiles,
  selectedPath,
  onSelectPath,
}: FileTreeProps) {
  const [query, setQuery] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() => new Set());

  const activeItems = useMemo(() => {
    const raw =
      mode === 'output'
        ? outputFiles.map((f) => ({ path: f.path, size: f.size, kind: f.kind }))
        : sourceFiles.map((f) => ({ path: f.path, size: f.size, kind: f.kind }));

    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return raw;
    return raw.filter((item) => item.path.toLowerCase().includes(trimmed));
  }, [mode, outputFiles, sourceFiles, query]);

  const tree = useMemo(() => buildTree(activeItems), [activeItems]);

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };

  const renderNodes = (nodes: TreeNode[], depth: number) => {
    return nodes.map((node) => {
      if (node.isFolder) {
        const isCollapsed = collapsedFolders.has(node.path) && !query.trim();
        return (
          <div key={node.path}>
            <button
              type="button"
              onClick={() => toggleFolder(node.path)}
              style={{ paddingLeft: `${8 + depth * 12}px` }}
              className="flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-slate-300 dark:hover:bg-slate-800/70"
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              )}
              {isCollapsed ? (
                <Folder className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
              ) : (
                <FolderOpen className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
              )}
              <span className="truncate">{node.name}</span>
            </button>
            {!isCollapsed && <div>{renderNodes(node.children, depth + 1)}</div>}
          </div>
        );
      }

      const isSelected = selectedPath === node.path;
      return (
        <button
          key={node.path}
          type="button"
          onClick={() => onSelectPath(node.path, mode)}
          style={{ paddingLeft: `${22 + depth * 12}px` }}
          className={`flex w-full items-center justify-between gap-2 rounded-md py-1.5 pr-2 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${
            isSelected
              ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
          }`}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {renderFileIcon(node.kind)}
            <span className="truncate font-mono text-[11px]">{node.name}</span>
          </span>
          {node.size !== undefined && (
            <span className="shrink-0 font-mono text-[10px] text-slate-400 tabular-nums dark:text-slate-500">
              {formatBytes(node.size)}
            </span>
          )}
        </button>
      );
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/80">
        <button
          type="button"
          onClick={() => onModeChange('output')}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
            mode === 'output'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          React Output ({outputFiles.length})
        </button>
        <button
          type="button"
          onClick={() => onModeChange('source')}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
            mode === 'source'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          Source ZIP ({sourceFiles.length})
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter files by path..."
          aria-label="Filter files by path"
          className="w-full rounded-md border border-slate-200 bg-white py-1.5 pr-3 pl-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="max-h-[340px] overflow-y-auto pr-1">
        {tree.length > 0 ? (
          renderNodes(tree, 0)
        ) : (
          <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            No files match "{query}".
          </p>
        )}
      </div>
    </div>
  );
}
