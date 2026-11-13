import type { TargetLanguage } from '../types/converter';

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'ismap',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
]);

const ATTRIBUTE_MAP: Record<string, string> = {
  acceptcharset: 'acceptCharset',
  'accept-charset': 'acceptCharset',
  accesskey: 'accessKey',
  allowfullscreen: 'allowFullScreen',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  charset: 'charSet',
  class: 'className',
  classid: 'classID',
  colspan: 'colSpan',
  contenteditable: 'contentEditable',
  contextmenu: 'contextMenu',
  crossorigin: 'crossOrigin',
  datetime: 'dateTime',
  enctype: 'encType',
  for: 'htmlFor',
  formaction: 'formAction',
  formenctype: 'formEncType',
  formmethod: 'formMethod',
  formnovalidate: 'formNoValidate',
  formtarget: 'formTarget',
  frameborder: 'frameBorder',
  hreflang: 'hrefLang',
  httpequiv: 'httpEquiv',
  'http-equiv': 'httpEquiv',
  inputmode: 'inputMode',
  maxlength: 'maxLength',
  mediagroup: 'mediaGroup',
  minlength: 'minLength',
  novalidate: 'noValidate',
  playsinline: 'playsInline',
  readonly: 'readOnly',
  referrerpolicy: 'referrerPolicy',
  rowspan: 'rowSpan',
  spellcheck: 'spellCheck',
  srcdoc: 'srcDoc',
  srcset: 'srcSet',
  tabindex: 'tabIndex',
  usemap: 'useMap',
  // SVG attributes
  'accent-height': 'accentHeight',
  'alignment-baseline': 'alignmentBaseline',
  'arabic-form': 'arabicForm',
  'baseline-shift': 'baselineShift',
  'cap-height': 'capHeight',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'color-interpolation': 'colorInterpolation',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'color-profile': 'colorProfile',
  'color-rendering': 'colorRendering',
  'dominant-baseline': 'dominantBaseline',
  'enable-background': 'enableBackground',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-size-adjust': 'fontSizeAdjust',
  'font-stretch': 'fontStretch',
  'font-style': 'fontStyle',
  'font-variant': 'fontVariant',
  'font-weight': 'fontWeight',
  'glyph-name': 'glyphName',
  'glyph-orientation-horizontal': 'glyphOrientationHorizontal',
  'glyph-orientation-vertical': 'glyphOrientationVertical',
  'horiz-adv-x': 'horizAdvX',
  'horiz-origin-x': 'horizOriginX',
  'image-rendering': 'imageRendering',
  'letter-spacing': 'letterSpacing',
  'lighting-color': 'lightingColor',
  'marker-end': 'markerEnd',
  'marker-mid': 'markerMid',
  'marker-start': 'markerStart',
  'overline-position': 'overlinePosition',
  'overline-thickness': 'overlineThickness',
  'paint-order': 'paintOrder',
  'panose-1': 'panose1',
  'pointer-events': 'pointerEvents',
  preserveaspectratio: 'preserveAspectRatio',
  'rendering-intent': 'renderingIntent',
  'shape-rendering': 'shapeRendering',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'strikethrough-position': 'strikethroughPosition',
  'strikethrough-thickness': 'strikethroughThickness',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-opacity': 'strokeOpacity',
  'stroke-width': 'strokeWidth',
  'text-anchor': 'textAnchor',
  'text-decoration': 'textDecoration',
  'text-rendering': 'textRendering',
  'underline-position': 'underlinePosition',
  'underline-thickness': 'underlineThickness',
  'unicode-bidi': 'unicodeBidi',
  'unicode-range': 'unicodeRange',
  'units-per-em': 'unitsPerEm',
  'v-alphabetic': 'vAlphabetic',
  'v-hanging': 'vHanging',
  'v-ideographic': 'vIdeographic',
  'v-mathematical': 'vMathematical',
  'vector-effect': 'vectorEffect',
  'vert-adv-y': 'vertAdvY',
  'vert-origin-x': 'vertOriginX',
  'vert-origin-y': 'vertOriginY',
  viewbox: 'viewBox',
  'word-spacing': 'wordSpacing',
  'writing-mode': 'writingMode',
  'x-height': 'xHeight',
  'xlink:actuate': 'xlinkActuate',
  'xlink:arcrole': 'xlinkArcrole',
  'xlink:href': 'xlinkHref',
  'xlink:role': 'xlinkRole',
  'xlink:show': 'xlinkShow',
  'xlink:title': 'xlinkTitle',
  'xlink:type': 'xlinkType',
  'xml:base': 'xmlBase',
  'xml:lang': 'xmlLang',
  'xml:space': 'xmlSpace',
  xmlnsxlink: 'xmlnsXlink',
};

const EVENT_ATTRIBUTE_MAP: Record<string, string> = {
  onclick: 'onClick',
  onchange: 'onChange',
  onsubmit: 'onSubmit',
  oninput: 'onInput',
  onkeydown: 'onKeyDown',
  onkeyup: 'onKeyUp',
  onmouseenter: 'onMouseEnter',
  onmouseleave: 'onMouseLeave',
  onfocus: 'onFocus',
  onblur: 'onBlur',
};

export interface ExtractedSection {
  componentName: string;
  tagName: string;
  jsxCode: string;
  attributesTransformed: number;
}

export interface HtmlConversionOutput {
  title: string;
  jsxBody: string;
  stylesheets: string[];
  inlineStyles: string[];
  scripts: string[];
  inlineScripts: string[];
  sections: ExtractedSection[];
  attributesTransformed: number;
  hasInlineScripts: boolean;
}

export function toPascalCase(input: string): string {
  const cleaned = input
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();
  if (!cleaned) return 'Component';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const pascal = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return /^[0-9]/.test(pascal) ? `Component${pascal}` : pascal;
}

function cssPropertyToCamelCase(prop: string): string {
  const trimmed = prop.trim();
  if (trimmed.startsWith('--')) return trimmed;
  return trimmed.toLowerCase().replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function parseStyleStringToJsx(styleStr: string): string {
  const entries: string[] = [];
  const declarations = styleStr.split(';');
  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const rawProp = decl.slice(0, colonIdx).trim();
    const rawVal = decl.slice(colonIdx + 1).trim();
    if (!rawProp || !rawVal) continue;
    const key = cssPropertyToCamelCase(rawProp);
    const safeVal = rawVal.replace(/'/g, "\\'");
    const formattedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
    entries.push(`${formattedKey}: '${safeVal}'`);
  }
  return `{{ ${entries.join(', ')} }}`;
}

function escapeJsxText(text: string): string {
  return text
    .replace(/\{/g, "{'{'}")
    .replace(/\}/g, "{'}'}");
}

function escapeAttrValue(value: string): string {
  return value.replace(/"/g, '&quot;');
}

export interface SerializeContext {
  preserveComments: boolean;
  resolveAssetPath: (rawPath: string) => string;
  onPageLinkRewrite?: (href: string) => string | null;
  attributesTransformed: number;
  isSvgRoot?: boolean;
}

function serializeAttributes(el: Element, ctx: SerializeContext): string {
  const parts: string[] = [];
  const attrs = Array.from(el.attributes);

  for (const attr of attrs) {
    const rawName = attr.name;
    const lowerName = rawName.toLowerCase();
    let value = attr.value;

    // Skip xmlns on inner SVG elements if redundant, keep on root svg
    if (lowerName === 'style') {
      const styleObj = parseStyleStringToJsx(value);
      parts.push(`style=${styleObj}`);
      ctx.attributesTransformed += 1;
      continue;
    }

    if (EVENT_ATTRIBUTE_MAP[lowerName]) {
      const reactEvent = EVENT_ATTRIBUTE_MAP[lowerName];
      ctx.attributesTransformed += 1;
      parts.push(`${reactEvent}={() => { /* Migrated from ${rawName}="${value.replace(/\*\//g, '* /')}" */ }}`);
      continue;
    }

    // Rewrite relative src/href/poster paths for assets or internal page links
    if ((lowerName === 'src' || lowerName === 'poster') && value) {
      value = ctx.resolveAssetPath(value);
    } else if (lowerName === 'href' && el.tagName.toLowerCase() === 'a' && value && ctx.onPageLinkRewrite) {
      const rewritten = ctx.onPageLinkRewrite(value);
      if (rewritten !== null) {
        parts.push(`href="${escapeAttrValue(rewritten)}"`);
        continue;
      }
    }

    // Map HTML/SVG attribute names to React camelCase
    let jsxName = rawName;
    if (ATTRIBUTE_MAP[lowerName]) {
      jsxName = ATTRIBUTE_MAP[lowerName];
      if (jsxName !== rawName) {
        ctx.attributesTransformed += 1;
      }
    } else if (lowerName.startsWith('data-') || lowerName.startsWith('aria-')) {
      jsxName = lowerName;
    }

    if (BOOLEAN_ATTRIBUTES.has(lowerName)) {
      if (value === '' || value.toLowerCase() === lowerName || value.toLowerCase() === 'true') {
        parts.push(jsxName);
      } else {
        parts.push(`${jsxName}={false}`);
      }
      continue;
    }

    if (lowerName === 'tabindex' && /^-?\d+$/.test(value.trim())) {
      parts.push(`${jsxName}={${value.trim()}}`);
      continue;
    }

    parts.push(`${jsxName}="${escapeAttrValue(value)}"`);
  }

  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

function serializeNode(node: Node, indentLevel: number, ctx: SerializeContext): string {
  const indent = '  '.repeat(indentLevel);

  if (node.nodeType === Node.TEXT_NODE) {
    const raw = node.textContent ?? '';
    if (!raw.trim()) {
      return '';
    }
    const collapsed = raw.replace(/\s+/g, ' ').trim();
    return `${indent}${escapeJsxText(collapsed)}`;
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    if (!ctx.preserveComments) return '';
    const commentText = (node.textContent ?? '').replace(/\*\//g, '* /').trim();
    if (!commentText) return '';
    return `${indent}{/* ${commentText} */}`;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const el = node as Element;
  const tagName = el.tagName.toLowerCase();

  // Strip script and style tags inside body (handled separately)
  if (tagName === 'script' || tagName === 'style') {
    return '';
  }

  // Convert textarea defaultValue nicely
  const attrsStr = serializeAttributes(el, ctx);

  if (VOID_ELEMENTS.has(tagName)) {
    return `${indent}<${tagName}${attrsStr} />`;
  }

  const childOutputs: string[] = [];
  for (const child of Array.from(el.childNodes)) {
    const serialized = serializeNode(child, indentLevel + 1, ctx);
    if (serialized) {
      childOutputs.push(serialized);
    }
  }

  if (childOutputs.length === 0) {
    return `${indent}<${tagName}${attrsStr} />`;
  }

  // Inline short single text child
  if (
    childOutputs.length === 1 &&
    !childOutputs[0].trimStart().startsWith('<') &&
    !childOutputs[0].trimStart().startsWith('{/*') &&
    childOutputs[0].trim().length < 64
  ) {
    return `${indent}<${tagName}${attrsStr}>${childOutputs[0].trim()}</${tagName}>`;
  }

  return `${indent}<${tagName}${attrsStr}>\n${childOutputs.join('\n')}\n${indent}</${tagName}>`;
}

function deriveSectionName(el: Element, index: number, usedNames: Set<string>): string {
  const tag = el.tagName.toLowerCase();
  const idAttr = el.getAttribute('id');
  const ariaLabel = el.getAttribute('aria-label');
  const classAttr = el.getAttribute('class');

  let base = '';
  if (tag === 'header') base = 'SiteHeader';
  else if (tag === 'nav') base = 'NavigationBar';
  else if (tag === 'footer') base = 'SiteFooter';
  else if (idAttr) base = toPascalCase(idAttr);
  else if (ariaLabel) base = toPascalCase(ariaLabel);
  else if (classAttr) {
    const firstClass = classAttr.split(/\s+/).find((c) => c.length > 2 && !/^(flex|grid|bg-|text-|p-|m-|w-|h-)/.test(c));
    if (firstClass) base = toPascalCase(firstClass);
  }

  if (!base) {
    base = `${toPascalCase(tag)}Section${index + 1}`;
  } else if (!base.endsWith('Section') && !base.endsWith('Header') && !base.endsWith('Footer') && !base.endsWith('Bar')) {
    base = `${base}Section`;
  }

  let candidate = base;
  let counter = 2;
  while (usedNames.has(candidate)) {
    candidate = `${base}${counter}`;
    counter += 1;
  }
  usedNames.add(candidate);
  return candidate;
}

export function convertHtmlDocumentToReact(
  htmlContent: string,
  options: {
    componentName: string;
    language: TargetLanguage;
    splitSections: boolean;
    preserveComments: boolean;
    resolveAssetPath: (rawPath: string) => string;
    onPageLinkRewrite?: (href: string) => string | null;
  }
): HtmlConversionOutput {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const title = doc.title?.trim() || options.componentName;

  const stylesheets: string[] = [];
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href) stylesheets.push(href);
  });

  const inlineStyles: string[] = [];
  doc.querySelectorAll('style').forEach((styleEl) => {
    const content = styleEl.textContent?.trim();
    if (content) inlineStyles.push(content);
  });

  const scripts: string[] = [];
  const inlineScripts: string[] = [];
  doc.querySelectorAll('script').forEach((scriptEl) => {
    const src = scriptEl.getAttribute('src');
    if (src) {
      scripts.push(src);
    } else if (scriptEl.textContent?.trim()) {
      inlineScripts.push(scriptEl.textContent.trim());
    }
  });

  const ctx: SerializeContext = {
    preserveComments: options.preserveComments,
    resolveAssetPath: options.resolveAssetPath,
    onPageLinkRewrite: options.onPageLinkRewrite,
    attributesTransformed: 0,
  };

  const body = doc.body;
  const sections: ExtractedSection[] = [];
  const usedSectionNames = new Set<string>([options.componentName, 'App']);

  const bodyChildren = Array.from(body.childNodes);
  const topLevelJSX: string[] = [];

  const splitTargets = new Set(['header', 'nav', 'section', 'footer']);

  for (let i = 0; i < bodyChildren.length; i += 1) {
    const child = bodyChildren[i];
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style') continue;

      if (options.splitSections && splitTargets.has(tag)) {
        const sectionCtx: SerializeContext = {
          preserveComments: options.preserveComments,
          resolveAssetPath: options.resolveAssetPath,
          onPageLinkRewrite: options.onPageLinkRewrite,
          attributesTransformed: 0,
        };
        const sectionJsx = serializeNode(el, 2, sectionCtx);
        if (sectionJsx) {
          const sectionName = deriveSectionName(el, sections.length, usedSectionNames);
          sections.push({
            componentName: sectionName,
            tagName: tag,
            jsxCode: sectionJsx,
            attributesTransformed: sectionCtx.attributesTransformed,
          });
          ctx.attributesTransformed += sectionCtx.attributesTransformed;
          topLevelJSX.push(`      <${sectionName} />`);
          continue;
        }
      }
    }

    const serialized = serializeNode(child, 3, ctx);
    if (serialized) {
      topLevelJSX.push(serialized);
    }
  }

  const jsxBody =
    topLevelJSX.length > 0
      ? `    <div className="converted-page">\n${topLevelJSX.join('\n')}\n    </div>`
      : `    <div className="converted-page" />`;

  return {
    title,
    jsxBody,
    stylesheets,
    inlineStyles,
    scripts,
    inlineScripts,
    sections,
    attributesTransformed: ctx.attributesTransformed,
    hasInlineScripts: inlineScripts.length > 0 || scripts.length > 0,
  };
}

export function buildReactComponentFile(params: {
  componentName: string;
  jsxReturnBody: string;
  language: TargetLanguage;
  imports?: string[];
  exportDefault?: boolean;
}): string {
  const { componentName, jsxReturnBody, language, imports = [], exportDefault = true } = params;
  const importBlock = imports.length > 0 ? `${imports.join('\n')}\n\n` : '';
  const typeImport = language === 'tsx' ? `import React from 'react';\n` : '';
  const signature =
    language === 'tsx'
      ? `export function ${componentName}(): React.JSX.Element`
      : `export function ${componentName}()`;

  const defaultExport = exportDefault ? `\nexport default ${componentName};\n` : '';

  return `${typeImport}${importBlock}${signature} {\n  return (\n${jsxReturnBody}\n  );\n}\n${defaultExport}`;
}

export function convertSvgToReactComponent(
  svgText: string,
  componentName: string,
  language: TargetLanguage
): { code: string; attributesTransformed: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');

  if (!svgEl) {
    const fallback =
      language === 'tsx'
        ? `import React from 'react';\n\nexport function ${componentName}(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {\n  return <svg viewBox="0 0 24 24" fill="none" {...props} />;\n}\n\nexport default ${componentName};\n`
        : `export function ${componentName}(props) {\n  return <svg viewBox="0 0 24 24" fill="none" {...props} />;\n}\n\nexport default ${componentName};\n`;
    return { code: fallback, attributesTransformed: 0 };
  }

  const ctx: SerializeContext = {
    preserveComments: false,
    resolveAssetPath: (p) => p,
    attributesTransformed: 0,
    isSvgRoot: true,
  };

  let serialized = serializeNode(svgEl, 2, ctx);
  // Inject {...props} onto the opening <svg ...> tag
  serialized = serialized.replace(/^(\s*<svg\b[^>]*?)(>| \/>)/, '$1 {...props}$2');

  const code =
    language === 'tsx'
      ? `import React from 'react';\n\nexport function ${componentName}(props: React.SVGProps<SVGSVGElement>): React.JSX.Element {\n  return (\n${serialized}\n  );\n}\n\nexport default ${componentName};\n`
      : `export function ${componentName}(props) {\n  return (\n${serialized}\n  );\n}\n\nexport default ${componentName};\n`;

  return { code, attributesTransformed: ctx.attributesTransformed };
}
