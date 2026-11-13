import JSZip from 'jszip';
import {
  buildReactComponentFile,
  convertHtmlDocumentToReact,
  convertSvgToReactComponent,
  toPascalCase,
} from './htmlToJsx';
import type {
  ConversionOptions,
  ConversionResult,
  ConvertedFile,
  DiagnosticEntry,
  OutputFileKind,
  PreviewPage,
  SourceFile,
  SourceFileKind,
} from '../types/converter';

const TEXT_EXTENSIONS = new Set([
  'html',
  'htm',
  'css',
  'js',
  'mjs',
  'cjs',
  'ts',
  'tsx',
  'jsx',
  'svg',
  'json',
  'txt',
  'md',
  'xml',
]);

function getExtension(path: string): string {
  const base = path.split('/').pop() ?? '';
  const idx = base.lastIndexOf('.');
  return idx === -1 ? '' : base.slice(idx + 1).toLowerCase();
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    mjs: 'text/javascript',
    ts: 'text/typescript',
    tsx: 'text/typescript',
    jsx: 'text/javascript',
    svg: 'image/svg+xml',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    md: 'text/markdown',
    txt: 'text/plain',
  };
  return map[ext] ?? 'application/octet-stream';
}

function classifySourceKind(ext: string): SourceFileKind {
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'css') return 'css';
  if (ext === 'js' || ext === 'mjs' || ext === 'cjs') return 'js';
  if (ext === 'svg') return 'svg';
  if (ext === 'json') return 'json';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'mp4', 'webm'].includes(ext)) {
    return 'asset';
  }
  return 'other';
}

function stripCommonRootFolder(paths: string[]): string {
  if (paths.length === 0) return '';
  const splitPaths = paths.map((p) => p.split('/').filter(Boolean));
  const firstSegment = splitPaths[0]?.[0];
  if (!firstSegment) return '';
  const allShareRoot = splitPaths.every((parts) => parts.length > 1 && parts[0] === firstSegment);
  return allShareRoot ? `${firstSegment}/` : '';
}

function resolveRelativePath(baseHtmlPath: string, rawRef: string): string {
  if (!rawRef || /^(https?:|data:|mailto:|tel:|#|\/\/)/i.test(rawRef.trim())) {
    return rawRef;
  }
  const cleanRef = rawRef.split('?')[0].split('#')[0];
  const baseParts = baseHtmlPath.split('/').slice(0, -1);
  const refParts = cleanRef.replace(/^\.\//, '').split('/');
  const resolved = [...baseParts];
  for (const part of refParts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return resolved.join('/');
}

function uint8ToDataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

function buildPreviewHtmlDocument(
  htmlContent: string,
  basePath: string,
  sourceMap: Map<string, SourceFile>
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Replace stylesheet <link> tags with inline <style> from ZIP
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const resolved = resolveRelativePath(basePath, href);
    const cssFile = sourceMap.get(resolved);
    if (cssFile?.textContent) {
      const styleEl = doc.createElement('style');
      let cssText = cssFile.textContent;
      cssText = cssText.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, assetRef: string) => {
        const assetPath = resolveRelativePath(resolved, assetRef);
        const assetFile = sourceMap.get(assetPath);
        if (assetFile?.binaryData) {
          return `url("${uint8ToDataUrl(assetFile.binaryData, assetFile.mimeType)}")`;
        }
        if (assetFile?.textContent && assetFile.kind === 'svg') {
          return `url("data:image/svg+xml;utf8,${encodeURIComponent(assetFile.textContent)}")`;
        }
        return match;
      });
      styleEl.textContent = cssText;
      link.replaceWith(styleEl);
    }
  });

  // Replace image / media src attributes with data URLs from ZIP
  doc.querySelectorAll('[src]').forEach((el) => {
    const src = el.getAttribute('src');
    if (!src || /^(https?:|data:|\/\/)/i.test(src)) return;
    if (el.tagName.toLowerCase() === 'script') {
      el.remove();
      return;
    }
    const resolved = resolveRelativePath(basePath, src);
    const file = sourceMap.get(resolved);
    if (file?.binaryData) {
      el.setAttribute('src', uint8ToDataUrl(file.binaryData, file.mimeType));
    } else if (file?.textContent && file.kind === 'svg') {
      el.setAttribute('src', `data:image/svg+xml;utf8,${encodeURIComponent(file.textContent)}`);
    }
  });

  // Disable external link navigation inside sandboxed iframe
  doc.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? '';
    if (!href.startsWith('#')) {
      anchor.setAttribute('onclick', 'return false;');
    }
  });

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

function sanitizeProjectName(fileName: string): string {
  const base = fileName.replace(/\.zip$/i, '').trim();
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || 'converted-react-app';
}

function formatTextFile(
  path: string,
  kind: OutputFileKind,
  textContent: string,
  sourceOrigin?: string
): ConvertedFile {
  const encoder = new TextEncoder();
  return {
    path,
    name: path.split('/').pop() ?? path,
    kind,
    size: encoder.encode(textContent).length,
    textContent,
    mimeType: getMimeType(kind),
    sourceOrigin,
  };
}

export async function convertZipBufferToReact(
  buffer: ArrayBuffer,
  archiveFileName: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  const zip = await JSZip.loadAsync(buffer);
  const rawPaths: string[] = [];

  zip.forEach((relativePath, entry) => {
    if (entry.dir) return;
    if (relativePath.startsWith('__MACOSX/') || relativePath.endsWith('.DS_Store')) return;
    rawPaths.push(relativePath);
  });

  if (rawPaths.length === 0) {
    throw new Error('This ZIP archive contains no readable files.');
  }

  const rootPrefix = stripCommonRootFolder(rawPaths);
  const sourceFiles: SourceFile[] = [];
  const sourceMap = new Map<string, SourceFile>();

  for (const rawPath of rawPaths.sort()) {
    const entry = zip.file(rawPath);
    if (!entry) continue;
    const normalizedPath = rootPrefix ? rawPath.slice(rootPrefix.length) : rawPath;
    const ext = getExtension(normalizedPath);
    const kind = classifySourceKind(ext);
    const mimeType = getMimeType(ext);
    const isText = TEXT_EXTENSIONS.has(ext);

    if (isText) {
      const textContent = await entry.async('string');
      const encoder = new TextEncoder();
      const sf: SourceFile = {
        path: normalizedPath,
        name: normalizedPath.split('/').pop() ?? normalizedPath,
        kind,
        size: encoder.encode(textContent).length,
        textContent,
        mimeType,
      };
      sourceFiles.push(sf);
      sourceMap.set(normalizedPath, sf);
    } else {
      const binaryData = await entry.async('uint8array');
      const sf: SourceFile = {
        path: normalizedPath,
        name: normalizedPath.split('/').pop() ?? normalizedPath,
        kind,
        size: binaryData.byteLength,
        binaryData,
        mimeType,
      };
      sourceFiles.push(sf);
      sourceMap.set(normalizedPath, sf);
    }
  }

  const projectName = sanitizeProjectName(archiveFileName);
  const ext = options.language;
  const outputFiles: ConvertedFile[] = [];
  const diagnostics: DiagnosticEntry[] = [];
  const previewPages: PreviewPage[] = [];

  const htmlFiles = sourceFiles.filter((f) => f.kind === 'html');
  const cssFiles = sourceFiles.filter((f) => f.kind === 'css');
  const svgFiles = sourceFiles.filter((f) => f.kind === 'svg');
  const jsFiles = sourceFiles.filter((f) => f.kind === 'js');
  const assetFiles = sourceFiles.filter((f) => f.kind === 'asset');

  let totalAttributesTransformed = 0;
  let componentCount = 0;
  let svgIconCount = 0;

  // Map source asset paths -> public/assets/... paths
  const assetOutputPathMap = new Map<string, string>();
  for (const file of [...assetFiles, ...svgFiles]) {
    const publicRel = `assets/${file.path}`;
    assetOutputPathMap.set(file.path, `/${publicRel}`);
    if (file.binaryData) {
      outputFiles.push({
        path: `public/${publicRel}`,
        name: file.name,
        kind: 'asset',
        size: file.size,
        binaryData: file.binaryData,
        mimeType: file.mimeType,
        sourceOrigin: file.path,
      });
    } else if (file.textContent) {
      outputFiles.push(formatTextFile(`public/${publicRel}`, 'asset', file.textContent, file.path));
    }
  }

  // Convert CSS files into src/styles/*
  const cssOutputImports: string[] = [];
  for (const css of cssFiles) {
    const outPath = `src/styles/${css.name}`;
    let cssText = css.textContent ?? '';
    cssText = cssText.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, assetRef: string) => {
      const resolved = resolveRelativePath(css.path, assetRef);
      const mapped = assetOutputPathMap.get(resolved);
      return mapped ? `url("${mapped}")` : match;
    });
    outputFiles.push(formatTextFile(outPath, 'css', cssText, css.path));
    cssOutputImports.push(`./styles/${css.name}`);
    diagnostics.push({
      id: `css-${css.path}`,
      sourcePath: css.path,
      outputPath: outPath,
      action: 'Stylesheet Migrated',
      details: 'Rewrote relative asset URLs for Vite public/ resolution.',
      attributesTransformed: 0,
      severity: 'converted',
    });
  }

  // Convert SVG files into typed React components under src/components/icons/
  const usedIconNames = new Set<string>();
  if (options.convertSvgs) {
    for (const svg of svgFiles) {
      let baseName = `${toPascalCase(svg.name)}Icon`;
      let counter = 2;
      while (usedIconNames.has(baseName)) {
        baseName = `${toPascalCase(svg.name)}Icon${counter}`;
        counter += 1;
      }
      usedIconNames.add(baseName);

      const { code, attributesTransformed } = convertSvgToReactComponent(
        svg.textContent ?? '',
        baseName,
        ext
      );
      const outPath = `src/components/icons/${baseName}.${ext}`;
      outputFiles.push(formatTextFile(outPath, ext, code, svg.path));
      svgIconCount += 1;
      totalAttributesTransformed += attributesTransformed;

      diagnostics.push({
        id: `svg-${svg.path}`,
        sourcePath: svg.path,
        outputPath: outPath,
        action: 'SVG to React Icon',
        details: `Generated ${baseName} with spread SVGProps and camelCase attributes.`,
        attributesTransformed,
        severity: 'converted',
      });
    }
  }

  // Convert HTML files into React Page Components (or App if single index.html)
  const pageEntries: Array<{
    routePath: string;
    componentName: string;
    title: string;
    sourcePath: string;
    outFilePath: string;
  }> = [];

  const extractedSectionFiles = new Map<string, string>();
  const usedPageNames = new Set<string>(['App']);

  // Sort so index.html comes first
  const sortedHtmlFiles = [...htmlFiles].sort((a, b) => {
    if (a.name.toLowerCase() === 'index.html') return -1;
    if (b.name.toLowerCase() === 'index.html') return 1;
    return a.path.localeCompare(b.path);
  });

  const isMultiPage = sortedHtmlFiles.length > 1;

  for (let i = 0; i < sortedHtmlFiles.length; i += 1) {
    const htmlFile = sortedHtmlFiles[i];
    const baseName = htmlFile.name.toLowerCase() === 'index.html' ? 'HomePage' : `${toPascalCase(htmlFile.path)}Page`;
    let pageComponentName = baseName;
    let suffix = 2;
    while (usedPageNames.has(pageComponentName)) {
      pageComponentName = `${baseName}${suffix}`;
      suffix += 1;
    }
    usedPageNames.add(pageComponentName);

    const routeSlug =
      htmlFile.name.toLowerCase() === 'index.html'
        ? '/'
        : `/${htmlFile.path.replace(/\.html?$/i, '').toLowerCase()}`;

    const conversion = convertHtmlDocumentToReact(htmlFile.textContent ?? '', {
      componentName: pageComponentName,
      language: ext,
      splitSections: options.splitSections,
      preserveComments: options.preserveComments,
      resolveAssetPath: (rawPath) => {
        const resolved = resolveRelativePath(htmlFile.path, rawPath);
        return assetOutputPathMap.get(resolved) ?? rawPath;
      },
      onPageLinkRewrite: (href) => {
        if (href.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(href)) return null;
        const resolvedHtml = resolveRelativePath(htmlFile.path, href.split('#')[0]);
        if (sourceMap.get(resolvedHtml)?.kind === 'html') {
          return resolvedHtml.toLowerCase() === 'index.html'
            ? '#/'
            : `#/${resolvedHtml.replace(/\.html?$/i, '').toLowerCase()}`;
        }
        return null;
      },
    });

    totalAttributesTransformed += conversion.attributesTransformed;

    // Emit extracted inline <style> blocks
    const inlineCssImports: string[] = [];
    if (conversion.inlineStyles.length > 0) {
      const inlineCssPath = `src/styles/${pageComponentName.toLowerCase()}.css`;
      outputFiles.push(
        formatTextFile(inlineCssPath, 'css', conversion.inlineStyles.join('\n\n'), htmlFile.path)
      );
      inlineCssImports.push(
        isMultiPage ? `../styles/${pageComponentName.toLowerCase()}.css` : `./styles/${pageComponentName.toLowerCase()}.css`
      );
    }

    // Emit extracted semantic section components
    const sectionImports: string[] = [];
    for (const sec of conversion.sections) {
      const secOutPath = `src/components/${sec.componentName}.${ext}`;
      if (!extractedSectionFiles.has(secOutPath)) {
        const secCode = buildReactComponentFile({
          componentName: sec.componentName,
          jsxReturnBody: sec.jsxCode,
          language: ext,
        });
        extractedSectionFiles.set(secOutPath, secCode);
        outputFiles.push(formatTextFile(secOutPath, ext, secCode, htmlFile.path));
        componentCount += 1;

        diagnostics.push({
          id: `sec-${htmlFile.path}-${sec.componentName}`,
          sourcePath: htmlFile.path,
          outputPath: secOutPath,
          action: 'Section Extracted',
          details: `Extracted <${sec.tagName}> landmark into reusable ${sec.componentName} component.`,
          attributesTransformed: sec.attributesTransformed,
          severity: 'converted',
        });
      }
      const importRel = isMultiPage
        ? `../components/${sec.componentName}`
        : `./components/${sec.componentName}`;
      sectionImports.push(`import { ${sec.componentName} } from '${importRel}';`);
    }

    const pageImports = [
      ...inlineCssImports.map((imp) => `import '${imp}';`),
      ...sectionImports,
    ];

    if (isMultiPage) {
      const pageOutPath = `src/pages/${pageComponentName}.${ext}`;
      const pageCode = buildReactComponentFile({
        componentName: pageComponentName,
        jsxReturnBody: conversion.jsxBody,
        language: ext,
        imports: pageImports,
      });
      outputFiles.push(formatTextFile(pageOutPath, ext, pageCode, htmlFile.path));
      componentCount += 1;

      pageEntries.push({
        routePath: routeSlug,
        componentName: pageComponentName,
        title: conversion.title,
        sourcePath: htmlFile.path,
        outFilePath: pageOutPath,
      });

      diagnostics.push({
        id: `html-${htmlFile.path}`,
        sourcePath: htmlFile.path,
        outputPath: pageOutPath,
        action: 'HTML to React Page',
        details: conversion.hasInlineScripts
          ? `Converted markup with ${conversion.sections.length} extracted sections. Script tags require hook migration.`
          : `Converted markup with ${conversion.sections.length} extracted sections.`,
        attributesTransformed: conversion.attributesTransformed,
        severity: conversion.hasInlineScripts ? 'warning' : 'converted',
      });
    } else {
      const appImports = [
        ...cssOutputImports.map((imp) => `import '${imp}';`),
        ...pageImports,
      ];
      const appCode = buildReactComponentFile({
        componentName: 'App',
        jsxReturnBody: conversion.jsxBody,
        language: ext,
        imports: appImports,
      });
      const appOutPath = `src/App.${ext}`;
      outputFiles.push(formatTextFile(appOutPath, ext, appCode, htmlFile.path));
      componentCount += 1;

      pageEntries.push({
        routePath: '/',
        componentName: 'App',
        title: conversion.title,
        sourcePath: htmlFile.path,
        outFilePath: appOutPath,
      });

      diagnostics.push({
        id: `html-${htmlFile.path}`,
        sourcePath: htmlFile.path,
        outputPath: appOutPath,
        action: 'HTML to React App',
        details: conversion.hasInlineScripts
          ? `Converted root document into App.${ext}. Detected script references for manual React hook migration.`
          : `Converted root document into App.${ext}.`,
        attributesTransformed: conversion.attributesTransformed,
        severity: conversion.hasInlineScripts ? 'warning' : 'converted',
      });
    }

    previewPages.push({
      title: conversion.title,
      sourcePath: htmlFile.path,
      componentName: isMultiPage ? pageComponentName : 'App',
      htmlDocument: buildPreviewHtmlDocument(htmlFile.textContent ?? '', htmlFile.path, sourceMap),
    });
  }

  // If multi-page, synthesize src/App.tsx with lightweight hash routing
  if (isMultiPage) {
    const pageImports = pageEntries.map(
      (p) => `import { ${p.componentName} } from './pages/${p.componentName}';`
    );
    const styleImports = cssOutputImports.map((imp) => `import '${imp}';`);
    const routeBranches = pageEntries
      .map((p) => {
        if (p.routePath === '/') return null;
        return `    if (route === '${p.routePath}') return <${p.componentName} />;`;
      })
      .filter(Boolean)
      .join('\n');

    const defaultPage = pageEntries[0]?.componentName ?? 'HomePage';
    const stateType = ext === 'tsx' ? '<string>' : '';
    const appSource = `import { useEffect, useState } from 'react';
${[...styleImports, ...pageImports].join('\n')}

function getHashRoute()${ext === 'tsx' ? ': string' : ''} {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
}

export function App()${ext === 'tsx' ? ': React.JSX.Element' : ''} {
  const [route, setRoute] = useState${stateType}(getHashRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getHashRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const renderPage = () => {
${routeBranches}
    return <${defaultPage} />;
  };

  return <>{renderPage()}</>;
}

export default App;
`;
    outputFiles.push(formatTextFile(`src/App.${ext}`, ext, appSource));
    componentCount += 1;
  } else if (htmlFiles.length === 0) {
    // Fallback App if archive contained only SVGs / CSS / JS
    const iconImports = Array.from(usedIconNames).map(
      (name) => `import { ${name} } from './components/icons/${name}';`
    );
    const iconCards = Array.from(usedIconNames)
      .map(
        (name) =>
          `        <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>\n          <${name} width={28} height={28} />\n          <div style={{ marginTop: '8px', fontSize: '12px' }}>${name}</div>\n        </div>`
      )
      .join('\n');

    const fallbackApp = `${ext === 'tsx' ? "import React from 'react';\n" : ''}${iconImports.join('\n')}

export function App()${ext === 'tsx' ? ': React.JSX.Element' : ''} {
  return (
    <main style={{ maxWidth: '960px', margin: '48px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>${projectName}</h1>
      <p>Converted ${svgIconCount} SVG icons and ${assetFiles.length} static assets from ${archiveFileName}.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', marginTop: '24px' }}>
${iconCards || '        <p>No HTML or SVG components detected in archive.</p>'}
      </div>
    </main>
  );
}

export default App;
`;
    outputFiles.push(formatTextFile(`src/App.${ext}`, ext, fallbackApp));
    componentCount += 1;
  }

  // Flag standalone JS files from original ZIP for manual migration review
  for (const jsFile of jsFiles) {
    const legacyOutPath = `src/legacy/${jsFile.name}`;
    outputFiles.push(formatTextFile(legacyOutPath, 'js', jsFile.textContent ?? '', jsFile.path));
    diagnostics.push({
      id: `js-${jsFile.path}`,
      sourcePath: jsFile.path,
      outputPath: legacyOutPath,
      action: 'Legacy Script Preserved',
      details: 'Copied imperative DOM script to src/legacy/ for incremental React useEffect migration.',
      attributesTransformed: 0,
      severity: 'warning',
    });
  }

  // Include runnable Vite + React scaffold files
  if (options.includeScaffold) {
    const pkgJson = {
      name: projectName,
      private: true,
      version: '0.1.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: ext === 'tsx' ? 'tsc -b && vite build' : 'vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
      },
      devDependencies:
        ext === 'tsx'
          ? {
              '@types/react': '^19.0.0',
              '@types/react-dom': '^19.0.0',
              '@vitejs/plugin-react': '^4.3.4',
              typescript: '^5.7.2',
              vite: '^6.0.5',
            }
          : {
              '@vitejs/plugin-react': '^4.3.4',
              vite: '^6.0.5',
            },
    };
    outputFiles.push(formatTextFile('package.json', 'json', JSON.stringify(pkgJson, null, 2)));

    const viteConfigPath = ext === 'tsx' ? 'vite.config.ts' : 'vite.config.js';
    outputFiles.push(
      formatTextFile(
        viteConfigPath,
        ext === 'tsx' ? 'ts' : 'js',
        `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});\n`
      )
    );

    if (ext === 'tsx') {
      outputFiles.push(
        formatTextFile(
          'tsconfig.json',
          'json',
          JSON.stringify(
            {
              compilerOptions: {
                target: 'ES2020',
                useDefineForClassFields: true,
                lib: ['ES2020', 'DOM', 'DOM.Iterable'],
                module: 'ESNext',
                skipLibCheck: true,
                moduleResolution: 'bundler',
                allowImportingTsExtensions: true,
                isolatedModules: true,
                moduleDetection: 'force',
                noEmit: true,
                jsx: 'react-jsx',
                strict: true,
              },
              include: ['src'],
            },
            null,
            2
          )
        )
      );
    }

    const pageTitle = pageEntries[0]?.title ?? projectName;
    outputFiles.push(
      formatTextFile(
        'index.html',
        'html',
        `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${pageTitle}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.${ext}"></script>\n  </body>\n</html>\n`
      )
    );

    outputFiles.push(
      formatTextFile(
        `src/main.${ext}`,
        ext,
        `import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App.${ext}';\n\ncreateRoot(document.getElementById('root')${ext === 'tsx' ? '!' : ''}).render(\n  <StrictMode>\n    <App />\n  </StrictMode>,\n);\n`
      )
    );

    outputFiles.push(
      formatTextFile(
        'README.md',
        'md',
        `# ${projectName}\n\nConverted from \`${archiveFileName}\` into a Vite + React (${ext.toUpperCase()}) project.\n\n## Run Locally\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`
      )
    );
  }

  // Sort output files logically: root config files first, then src/, then public/
  outputFiles.sort((a, b) => a.path.localeCompare(b.path));

  const totalSourceBytes = sourceFiles.reduce((acc, f) => acc + f.size, 0);
  const totalOutputBytes = outputFiles.reduce((acc, f) => acc + f.size, 0);

  return {
    projectName,
    archiveFileName,
    sourceFiles,
    outputFiles,
    diagnostics,
    previewPages,
    stats: {
      sourceFileCount: sourceFiles.length,
      outputFileCount: outputFiles.length,
      componentCount,
      svgIconCount,
      stylesheetCount: cssFiles.length,
      assetCount: assetFiles.length,
      attributesTransformed: totalAttributesTransformed,
      totalSourceBytes,
      totalOutputBytes,
    },
  };
}

export async function exportReactProjectZip(result: ConversionResult): Promise<void> {
  const zip = new JSZip();
  for (const file of result.outputFiles) {
    if (file.binaryData) {
      zip.file(file.path, file.binaryData);
    } else if (file.textContent !== undefined) {
      zip.file(file.path, file.textContent);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${result.projectName}-react.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSingleOutputFile(file: ConvertedFile): void {
  const blob = file.binaryData
    ? new Blob([new Uint8Array(file.binaryData)], { type: file.mimeType })
    : new Blob([file.textContent ?? ''], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
