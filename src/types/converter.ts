export type TargetLanguage = 'tsx' | 'jsx';

export interface ConversionOptions {
  language: TargetLanguage;
  splitSections: boolean;
  convertSvgs: boolean;
  includeScaffold: boolean;
  preserveComments: boolean;
}

export type SourceFileKind = 'html' | 'css' | 'js' | 'svg' | 'json' | 'asset' | 'other';

export interface SourceFile {
  path: string;
  name: string;
  kind: SourceFileKind;
  size: number;
  textContent?: string;
  binaryData?: Uint8Array;
  mimeType: string;
}

export type OutputFileKind = 'tsx' | 'jsx' | 'ts' | 'js' | 'css' | 'json' | 'html' | 'md' | 'asset';

export interface ConvertedFile {
  path: string;
  name: string;
  kind: OutputFileKind;
  size: number;
  textContent?: string;
  binaryData?: Uint8Array;
  mimeType: string;
  sourceOrigin?: string;
}

export type DiagnosticSeverity = 'converted' | 'warning' | 'copied';

export interface DiagnosticEntry {
  id: string;
  sourcePath: string;
  outputPath: string;
  action: string;
  details: string;
  attributesTransformed: number;
  severity: DiagnosticSeverity;
}

export interface PreviewPage {
  title: string;
  sourcePath: string;
  componentName: string;
  htmlDocument: string;
}

export interface ConversionStats {
  sourceFileCount: number;
  outputFileCount: number;
  componentCount: number;
  svgIconCount: number;
  stylesheetCount: number;
  assetCount: number;
  attributesTransformed: number;
  totalSourceBytes: number;
  totalOutputBytes: number;
}

export interface ConversionResult {
  projectName: string;
  archiveFileName: string;
  sourceFiles: SourceFile[];
  outputFiles: ConvertedFile[];
  diagnostics: DiagnosticEntry[];
  previewPages: PreviewPage[];
  stats: ConversionStats;
}

export interface SampleTemplateMeta {
  id: string;
  name: string;
  archiveName: string;
  summary: string;
  fileCountHint: string;
}
