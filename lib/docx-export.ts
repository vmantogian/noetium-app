import {
  AlignmentType,
  Document,
  HeadingLevel,
  LevelFormat,
  Math as MathEquation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { latexToMath } from './math-omml';

// Times New Roman covers the entire Greek block — accented vowels, diaeresis,
// and both medial (σ) and final (ς) sigma — and ships with Word on Windows and
// macOS. Its metric-compatible open substitute (Liberation Serif) has the same
// Greek coverage, so LibreOffice renders these files identically rather than
// falling back to a font that would drop accents.
const GREEK_SAFE_FONT = 'Times New Roman';

// Greek schools use A4, not Letter. Dimensions are in twips (1/1440 inch).
const A4_WIDTH_TWIPS = 11906;
const A4_HEIGHT_TWIPS = 16838;
const PAGE_MARGIN_TWIPS = 1134; // 2cm

const ORDERED_LIST_REFERENCE = 'noetium-ordered';

export type InlineText =
  | string
  | { text: string; bold?: boolean; italic?: boolean; underline?: boolean }
  /** LaTeX typeset as a real Word equation, inline with the surrounding text. */
  | { math: string };

export type BlockAlignment = 'left' | 'center' | 'right' | 'justify';

export type DocxBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: InlineText | InlineText[]; align?: BlockAlignment }
  | { type: 'list'; ordered?: boolean; items: Array<InlineText | InlineText[]> }
  | { type: 'table'; headers?: string[]; rows: Array<Array<InlineText | InlineText[]>> }
  /** LaTeX typeset as a Word equation on its own centred line. */
  | { type: 'equation'; latex: string; align?: BlockAlignment }
  | { type: 'pageBreak' };

export interface DocxSection {
  heading?: string;
  blocks: DocxBlock[];
}

export interface DocxMetadata {
  author?: string;
  subject?: string;
  description?: string;
  keywords?: string[];
}

export interface DocxDocumentInput {
  title: string;
  metadata?: DocxMetadata;
  sections: DocxSection[];
}

// Caps exist because the route accepts untrusted JSON and a large payload turns
// into a much larger in-memory OOXML tree before it is ever zipped.
const LIMITS = {
  titleLength: 300,
  textLength: 20_000,
  latexLength: 2_000,
  sections: 200,
  blocksPerSection: 2_000,
  listItems: 1_000,
  tableRows: 1_000,
  tableColumns: 32,
};

export class DocxInputError extends Error {}

function fail(path: string, expected: string): never {
  throw new DocxInputError(`${path}: expected ${expected}`);
}

function asString(value: unknown, path: string, maxLength: number): string {
  if (typeof value !== 'string') fail(path, 'a string');
  if (value.length > maxLength) fail(path, `at most ${maxLength} characters`);
  return value;
}

function asInline(value: unknown, path: string): InlineText {
  if (typeof value === 'string') return asString(value, path, LIMITS.textLength);
  if (typeof value !== 'object' || value === null) fail(path, 'a string or run object');
  const run = value as Record<string, unknown>;
  if (run.math !== undefined) {
    return { math: asString(run.math, `${path}.math`, LIMITS.latexLength) };
  }
  return {
    text: asString(run.text, `${path}.text`, LIMITS.textLength),
    bold: run.bold === undefined ? undefined : Boolean(run.bold),
    italic: run.italic === undefined ? undefined : Boolean(run.italic),
    underline: run.underline === undefined ? undefined : Boolean(run.underline),
  };
}

function asInlineList(value: unknown, path: string): InlineText | InlineText[] {
  if (Array.isArray(value)) return value.map((v, i) => asInline(v, `${path}[${i}]`));
  return asInline(value, path);
}

function asBlock(value: unknown, path: string): DocxBlock {
  if (typeof value !== 'object' || value === null) fail(path, 'an object');
  const block = value as Record<string, unknown>;

  switch (block.type) {
    case 'heading': {
      const level = block.level;
      if (level !== 1 && level !== 2 && level !== 3) fail(`${path}.level`, '1, 2 or 3');
      return { type: 'heading', level, text: asString(block.text, `${path}.text`, LIMITS.titleLength) };
    }

    case 'paragraph': {
      const align = block.align;
      if (align !== undefined && !(typeof align === 'string' && align in ALIGNMENT)) {
        fail(`${path}.align`, 'left, center, right or justify');
      }
      return {
        type: 'paragraph',
        text: asInlineList(block.text, `${path}.text`),
        align: align as BlockAlignment | undefined,
      };
    }

    case 'list': {
      if (!Array.isArray(block.items)) fail(`${path}.items`, 'an array');
      if (block.items.length > LIMITS.listItems) fail(`${path}.items`, `at most ${LIMITS.listItems} items`);
      return {
        type: 'list',
        ordered: block.ordered === undefined ? undefined : Boolean(block.ordered),
        items: block.items.map((item, i) => asInlineList(item, `${path}.items[${i}]`)),
      };
    }

    case 'table': {
      if (!Array.isArray(block.rows)) fail(`${path}.rows`, 'an array');
      if (block.rows.length > LIMITS.tableRows) fail(`${path}.rows`, `at most ${LIMITS.tableRows} rows`);
      let headers: string[] | undefined;
      if (block.headers !== undefined) {
        if (!Array.isArray(block.headers)) fail(`${path}.headers`, 'an array');
        if (block.headers.length > LIMITS.tableColumns) {
          fail(`${path}.headers`, `at most ${LIMITS.tableColumns} columns`);
        }
        headers = block.headers.map((h, i) => asString(h, `${path}.headers[${i}]`, LIMITS.textLength));
      }
      const rows = block.rows.map((row, r) => {
        if (!Array.isArray(row)) fail(`${path}.rows[${r}]`, 'an array');
        if (row.length > LIMITS.tableColumns) {
          fail(`${path}.rows[${r}]`, `at most ${LIMITS.tableColumns} columns`);
        }
        return row.map((cell, c) => asInlineList(cell, `${path}.rows[${r}][${c}]`));
      });
      return { type: 'table', headers, rows };
    }

    case 'equation': {
      const align = block.align;
      if (align !== undefined && !(typeof align === 'string' && align in ALIGNMENT)) {
        fail(`${path}.align`, 'left, center, right or justify');
      }
      return {
        type: 'equation',
        latex: asString(block.latex, `${path}.latex`, LIMITS.latexLength),
        align: align as BlockAlignment | undefined,
      };
    }

    case 'pageBreak':
      return { type: 'pageBreak' };

    default:
      fail(`${path}.type`, 'heading, paragraph, list, table, equation or pageBreak');
  }
}

/**
 * Validates untrusted JSON into a DocxDocumentInput. Throws DocxInputError.
 */
export function parseDocxDocument(value: unknown): DocxDocumentInput {
  if (typeof value !== 'object' || value === null) fail('body', 'an object');
  const input = value as Record<string, unknown>;

  const title = asString(input.title, 'title', LIMITS.titleLength);
  if (!title.trim()) fail('title', 'a non-empty string');

  if (!Array.isArray(input.sections)) fail('sections', 'an array');
  if (input.sections.length === 0) fail('sections', 'at least one section');
  if (input.sections.length > LIMITS.sections) fail('sections', `at most ${LIMITS.sections} sections`);

  const sections = input.sections.map((raw, s) => {
    if (typeof raw !== 'object' || raw === null) fail(`sections[${s}]`, 'an object');
    const section = raw as Record<string, unknown>;
    if (!Array.isArray(section.blocks)) fail(`sections[${s}].blocks`, 'an array');
    if (section.blocks.length > LIMITS.blocksPerSection) {
      fail(`sections[${s}].blocks`, `at most ${LIMITS.blocksPerSection} blocks`);
    }
    return {
      heading:
        section.heading === undefined
          ? undefined
          : asString(section.heading, `sections[${s}].heading`, LIMITS.titleLength),
      blocks: section.blocks.map((b, i) => asBlock(b, `sections[${s}].blocks[${i}]`)),
    };
  });

  let metadata: DocxMetadata | undefined;
  if (input.metadata !== undefined) {
    if (typeof input.metadata !== 'object' || input.metadata === null) fail('metadata', 'an object');
    const meta = input.metadata as Record<string, unknown>;
    if (meta.keywords !== undefined && !Array.isArray(meta.keywords)) fail('metadata.keywords', 'an array');
    metadata = {
      author: meta.author === undefined ? undefined : asString(meta.author, 'metadata.author', 200),
      subject: meta.subject === undefined ? undefined : asString(meta.subject, 'metadata.subject', 300),
      description:
        meta.description === undefined ? undefined : asString(meta.description, 'metadata.description', 1_000),
      keywords: (meta.keywords as unknown[] | undefined)?.map((k, i) =>
        asString(k, `metadata.keywords[${i}]`, 100)
      ),
    };
  }

  return { title, metadata, sections };
}

const ALIGNMENT: Record<BlockAlignment, (typeof AlignmentType)[keyof typeof AlignmentType]> = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
};

const HEADING_LEVEL = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
} as const;

type ParagraphContent = TextRun | MathEquation;

/**
 * Typesets LaTeX as a Word equation, or falls back to highlighted source text.
 *
 * A refusal must never be silent: an exam whose equations quietly vanished, or
 * whose fraction bar was invented, is worse than one that shows the author the
 * LaTeX they need to simplify. The highlight survives printing as grey.
 */
function renderMath(latex: string): ParagraphContent[] {
  const result = latexToMath(latex);
  if (result.ok) return [new MathEquation({ children: [...result.children] })];

  console.warn(`DOCX maths not typeset (${result.reason}) for: ${latex}`);
  return [new TextRun({ text: latex, italics: true, highlight: 'yellow' })];
}

function toRuns(text: InlineText | InlineText[]): ParagraphContent[] {
  const parts = Array.isArray(text) ? text : [text];
  return parts.flatMap((part) => {
    if (typeof part === 'string') return [new TextRun({ text: part })];
    if ('math' in part) return renderMath(part.math);
    return [
      new TextRun({
        text: part.text,
        bold: part.bold,
        italics: part.italic,
        underline: part.underline ? {} : undefined,
      }),
    ];
  });
}

function renderHeaderCell(text: string): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
    shading: { fill: 'EFEFEF' },
  });
}

function renderCell(content: InlineText | InlineText[]): TableCell {
  return new TableCell({ children: [new Paragraph({ children: toRuns(content) })] });
}

function renderBlock(block: DocxBlock): Array<Paragraph | Table> {
  switch (block.type) {
    case 'heading':
      return [
        new Paragraph({
          heading: HEADING_LEVEL[block.level],
          children: [new TextRun({ text: block.text })],
        }),
      ];

    case 'paragraph':
      return [
        new Paragraph({
          alignment: block.align ? ALIGNMENT[block.align] : undefined,
          children: toRuns(block.text),
          spacing: { after: 120 },
        }),
      ];

    case 'list':
      return block.items.map(
        (item) =>
          new Paragraph({
            children: toRuns(item),
            ...(block.ordered
              ? { numbering: { reference: ORDERED_LIST_REFERENCE, level: 0 } }
              : { bullet: { level: 0 } }),
          })
      );

    case 'table': {
      const rows: TableRow[] = [];
      if (block.headers?.length) {
        rows.push(
          new TableRow({
            tableHeader: true,
            children: block.headers.map(renderHeaderCell),
          })
        );
      }
      for (const row of block.rows) {
        rows.push(new TableRow({ children: row.map((cell) => renderCell(cell)) }));
      }
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        }),
      ];
    }

    case 'equation':
      return [
        new Paragraph({
          alignment: ALIGNMENT[block.align ?? 'center'],
          children: renderMath(block.latex),
          spacing: { before: 120, after: 120 },
        }),
      ];

    case 'pageBreak':
      return [new Paragraph({ children: [], pageBreakBefore: true })];
  }
}

function renderSection(section: DocxSection): Array<Paragraph | Table> {
  const children: Array<Paragraph | Table> = [];
  if (section.heading) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: section.heading })],
      })
    );
  }
  for (const block of section.blocks) {
    children.push(...renderBlock(block));
  }
  return children;
}

export const DOCX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Builds a Content-Disposition value for a possibly-Greek title.
 *
 * HTTP header values are latin-1, so the real (Greek) name travels in the
 * RFC 5987 filename* parameter while filename carries an ASCII fallback for
 * older clients. Sanitising both parameters also rules out CRLF header
 * injection via a caller-supplied title.
 */
export function docxContentDisposition(title: string): string {
  const base = title.trim().slice(0, 100) || 'document';
  const ascii =
    base
      .replace(/[^A-Za-z0-9._-]+/g, '_')
      .replace(/\.{2,}/g, '.')
      .replace(/^[._]+|[._]+$/g, '') || 'document';
  // encodeURIComponent leaves ' ( ) * unescaped, but they are not valid
  // attr-chars in an RFC 5987 ext-value, so escape them explicitly.
  const encoded = encodeURIComponent(`${base}.docx`).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `attachment; filename="${ascii}.docx"; filename*=UTF-8''${encoded}`;
}

export async function buildDocx(input: DocxDocumentInput): Promise<Buffer> {
  const body: Array<Paragraph | Table> = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: input.title })],
      spacing: { after: 240 },
    }),
    ...input.sections.flatMap(renderSection),
  ];

  const doc = new Document({
    title: input.title,
    creator: input.metadata?.author ?? 'Noetium',
    subject: input.metadata?.subject,
    description: input.metadata?.description,
    keywords: input.metadata?.keywords?.join(', '),
    styles: {
      default: {
        document: {
          run: { font: GREEK_SAFE_FONT, size: 24 },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: ORDERED_LIST_REFERENCE,
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
            margin: {
              top: PAGE_MARGIN_TWIPS,
              bottom: PAGE_MARGIN_TWIPS,
              left: PAGE_MARGIN_TWIPS,
              right: PAGE_MARGIN_TWIPS,
            },
          },
        },
        children: body,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
