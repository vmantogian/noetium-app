import {
  MathComponent,
  MathCurlyBrackets,
  MathFraction,
  MathFunction,
  MathIntegral,
  MathLimitLower,
  MathRadical,
  MathRoundBrackets,
  MathRun,
  MathSquareBrackets,
  MathSubScript,
  MathSubSuperScript,
  MathSum,
  MathSuperScript,
} from 'docx';
import temml from 'temml';

/**
 * Converts LaTeX to Word's native equation format (OMML).
 *
 * Pipeline: LaTeX --temml--> MathML tree --this module--> docx Math* builders.
 *
 * Word equations are built through docx's typed builders rather than by
 * injecting raw OMML, which keeps output well-formed and avoids the
 * ImportedXmlComponent path that silently emits `<undefined>`.
 *
 * Anything outside the supported subset is REFUSED rather than approximated.
 * Emitting maths that is subtly wrong on a printed exam is worse than showing
 * the author the LaTeX and asking them to simplify it — see UNSUPPORTED below.
 *
 * Supported subset, chosen to cover the Greek Gymnasio/Lykeio syllabus:
 *   fractions          \frac{a}{b}, nested
 *   roots              \sqrt{x}, \sqrt[n]{x}
 *   scripts            x^2, a_1, x_1^2
 *   sums and integrals \sum_{i=1}^{n}, \int_a^b, \oint
 *   limits             \lim_{x \to 0}, \max, \min, \sup, \inf
 *   delimiters         \left( \right), [ ], \{ \}
 *   named functions    \sin, \cos, \tan, \log, \ln (wrapped in m:func so Word
 *                      treats the name as a function; docx emits no m:rPr, so
 *                      m:sty="p" cannot be set to force the name upright)
 *   Greek letters      \alpha … \omega, and literal Greek typed directly
 *   relations          = < > \leq \geq \neq \approx \pm \times \div \circ
 */

/** LaTeX constructs deliberately refused, with the reason. */
export const UNSUPPORTED: Readonly<Record<string, string>> = Object.freeze({
  binomial:
    'Word equations via docx cannot suppress the fraction bar, so \\binom would render as a fraction — mathematically wrong.',
  accent: 'docx exposes no accent (m:acc) builder, so \\hat, \\vec, \\bar, \\tilde cannot be placed over a symbol.',
  overline: 'docx exposes no bar builder, so \\overline / \\underline cannot be drawn.',
  matrix: 'docx exposes no matrix builder, so matrices, \\cases and aligned environments cannot be built.',
  nAryProduct: 'docx provides only sum and integral n-ary operators, so \\prod cannot be built.',
});

export type MathResult =
  | { readonly ok: true; readonly children: readonly MathComponent[] }
  | { readonly ok: false; readonly reason: string };

/** Minimal structural view of a Temml MathML node; Temml types this as `any`. */
interface MathMLNode {
  readonly type?: string;
  readonly text?: string;
  readonly attributes?: Record<string, string | undefined>;
  readonly children?: readonly MathMLNode[];
}

class UnsupportedMath extends Error {}

function refuse(reason: string): never {
  throw new UnsupportedMath(reason);
}

// U+2061 FUNCTION APPLICATION marks "the thing before me is a function applied
// to the thing after me". Temml emits it for \sin, \cos, \log and friends, which
// makes named functions detectable structurally rather than by guessing.
const FUNCTION_APPLY = '⁡';

// The remaining invisible operators carry no visual meaning; Temml emits them
// for spacing/semantics and Word has no use for them.
const INVISIBLE = new Set([FUNCTION_APPLY, '⁢', '⁣', '⁤', '​']);

const SUM_CHARS = new Set(['∑']); // ∑
const INTEGRAL_CHARS = new Set(['∫', '∬', '∭', '∮']); // ∫ ∬ ∭ ∮
const PRODUCT_CHARS = new Set(['∏', '∐']); // ∏ ∐

// Operators whose limit belongs underneath the name rather than beside it.
const LIMIT_FUNCTIONS = new Set(['lim', 'max', 'min', 'sup', 'inf', 'limsup', 'liminf', 'argmax', 'argmin']);

const BRACKET_PAIRS: ReadonlyArray<{
  readonly open: string;
  readonly close: string;
  readonly build: (children: readonly MathComponent[]) => MathComponent;
}> = [
  { open: '(', close: ')', build: (children) => new MathRoundBrackets({ children }) },
  { open: '[', close: ']', build: (children) => new MathSquareBrackets({ children }) },
  { open: '{', close: '}', build: (children) => new MathCurlyBrackets({ children }) },
];

function textOf(node: MathMLNode): string {
  if (typeof node.text === 'string') return node.text;
  return (node.children ?? []).map(textOf).join('');
}

function kids(node: MathMLNode): readonly MathMLNode[] {
  return node.children ?? [];
}

/** Elements that carry no structure of their own and can be spliced away. */
const TRANSPARENT = new Set(['mstyle', 'mpadded', 'mphantom', 'semantics', 'annotation-xml', 'math']);

function isStretchyFence(node: MathMLNode, form: 'prefix' | 'postfix'): boolean {
  return (
    node.type === 'mo' &&
    node.attributes?.stretchy === 'true' &&
    node.attributes?.fence === 'true' &&
    node.attributes?.form === form
  );
}

/**
 * Recognises `\left( … \right)`. Temml marks these fences stretchy, which is
 * exactly the case where Word needs an m:d delimiter so the brackets grow
 * around a fraction. Plain `f(x)` parens are left as ordinary runs.
 */
function matchStretchyBrackets(
  children: readonly MathMLNode[]
): { readonly build: (c: readonly MathComponent[]) => MathComponent; readonly inner: readonly MathMLNode[] } | null {
  if (children.length < 2) return null;
  const first = children[0];
  const last = children[children.length - 1];
  if (!isStretchyFence(first, 'prefix') || !isStretchyFence(last, 'postfix')) return null;
  const pair = BRACKET_PAIRS.find((p) => p.open === textOf(first) && p.close === textOf(last));
  if (!pair) return null;
  return { build: pair.build, inner: children.slice(1, -1) };
}

function isFunctionApply(node: MathMLNode): boolean {
  return node.type === 'mo' && textOf(node) === FUNCTION_APPLY;
}

/**
 * Temml wraps a function name together with its U+2061 marker in a nested mrow
 * but leaves the argument outside it, so `\cos 60` arrives as
 * `[mrow[mi(cos), mo(⁡), mspace], msup(60, ∘)]`. Splicing that group into the
 * parent sequence puts name, marker and argument at one level, which is what
 * the function rule below needs. Only mrows holding the marker are touched, so
 * genuine groupings such as bracket contents are left alone.
 */
function flattenFunctionGroups(nodes: readonly MathMLNode[]): readonly MathMLNode[] {
  const isGroup = (n: MathMLNode) => n.type === 'mrow' && kids(n).some(isFunctionApply);
  if (!nodes.some(isGroup)) return nodes;
  return nodes.flatMap((n) => (isGroup(n) ? kids(n) : [n]));
}

/** Index of the first node at or after `from` that is not pure spacing. */
function skipSpacing(nodes: readonly MathMLNode[], from: number): number {
  let i = from;
  while (i < nodes.length && (nodes[i].type === 'mspace' || isFunctionApply(nodes[i]))) i++;
  return i;
}

/** Base of a script construct, seen through transparent wrappers. */
function scriptBase(node: MathMLNode): MathMLNode {
  let current = node;
  while (current.type && TRANSPARENT.has(current.type) && kids(current).length === 1) {
    current = kids(current)[0];
  }
  if (current.type === 'mrow' && kids(current).length === 1) return scriptBase(kids(current)[0]);
  return current;
}

function nAryKind(base: MathMLNode): 'sum' | 'integral' | null {
  if (base.type !== 'mo') return null;
  const ch = textOf(base).trim();
  if (SUM_CHARS.has(ch)) return 'sum';
  if (INTEGRAL_CHARS.has(ch)) return 'integral';
  if (PRODUCT_CHARS.has(ch)) refuse(UNSUPPORTED.nAryProduct);
  return null;
}

function limitFunctionName(base: MathMLNode): string | null {
  if (base.type !== 'mi' && base.type !== 'mo') return null;
  const name = textOf(base).trim();
  return LIMIT_FUNCTIONS.has(name) ? name : null;
}

function buildNAry(
  kind: 'sum' | 'integral',
  body: readonly MathComponent[],
  subScript?: readonly MathComponent[],
  superScript?: readonly MathComponent[]
): MathComponent {
  const options = { children: body, subScript, superScript };
  // MathSum writes m:chr="∑" explicitly; MathIntegral deliberately writes no
  // m:chr because OOXML's default n-ary character is already ∫. The integral
  // also uses limLoc="subSup" (limits beside) rather than the sum's "undOvr".
  return kind === 'sum' ? new MathSum(options) : new MathIntegral(options);
}

/**
 * Converts a run of sibling nodes. Needs to be sequence-aware because an n-ary
 * operator or a `lim` takes the nodes that follow it as its operand.
 */
function convertSequence(input: readonly MathMLNode[]): MathComponent[] {
  const bracketed = matchStretchyBrackets(input);
  if (bracketed) return [bracketed.build(convertSequence(bracketed.inner))];

  const nodes = flattenFunctionGroups(input);
  const out: MathComponent[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const script = asScript(node);

    if (script) {
      const base = scriptBase(script.base);
      const kind = nAryKind(base);
      const limitName = limitFunctionName(base);

      if (kind || limitName) {
        // The operand is everything after this operator in the sequence.
        const operand = convertSequence(nodes.slice(i + 1));
        const body = operand.length ? operand : [new MathRun('')];

        if (kind) {
          out.push(
            buildNAry(
              kind,
              body,
              script.sub ? convertSequence([script.sub]) : undefined,
              script.sup ? convertSequence([script.sup]) : undefined
            )
          );
        } else {
          if (!script.sub) refuse(`\\${limitName} without a limit is not supported.`);
          out.push(
            new MathFunction({
              // MathLimitLower is outside docx's MathComponent union but is the
              // only route to m:limLow, which puts the limit under the name.
              name: [
                new MathLimitLower({
                  children: [new MathRun(limitName as string)],
                  limit: convertSequence([script.sub]),
                }),
              ] as unknown as readonly MathComponent[],
              children: body,
            })
          );
        }
        return out; // operand consumed the rest of the sequence
      }
    }

    // A named function such as \sin or \log: the U+2061 marker sits directly
    // after the name. Only the next single term becomes the argument, because
    // in `\sin x + \cos x` the sine applies to x alone, not to the whole tail.
    // m:func draws no brackets, so a narrow argument costs a little spacing
    // rather than changing what the expression means.
    if (i + 1 < nodes.length && isFunctionApply(nodes[i + 1])) {
      const argAt = skipSpacing(nodes, i + 1);
      const argument = argAt < nodes.length ? convertNode(nodes[argAt]) : [];
      out.push(
        new MathFunction({
          name: convertNode(node),
          children: argument.length ? argument : [new MathRun('')],
        })
      );
      i = argAt;
      continue;
    }

    out.push(...convertNode(node));
  }

  return out;
}

interface ScriptParts {
  readonly base: MathMLNode;
  readonly sub?: MathMLNode;
  readonly sup?: MathMLNode;
}

/** Normalises the script-like MathML elements into base/sub/sup. */
function asScript(node: MathMLNode): ScriptParts | null {
  const c = kids(node);
  switch (node.type) {
    case 'msub':
    case 'munder':
      return c.length === 2 ? { base: c[0], sub: c[1] } : null;
    case 'msup':
    case 'mover':
      return c.length === 2 ? { base: c[0], sup: c[1] } : null;
    case 'msubsup':
    case 'munderover':
      return c.length === 3 ? { base: c[0], sub: c[1], sup: c[2] } : null;
    default:
      return null;
  }
}

function convertNode(node: MathMLNode): MathComponent[] {
  const type = node.type;

  if (type === undefined) {
    if (typeof node.text === 'string') return node.text.length ? [new MathRun(node.text)] : [];
    // Temml wraps multi-token expressions in a DocumentFragment, which has no
    // type and carries no MathML meaning of its own.
    if (node.children) return convertSequence(kids(node));
    return [];
  }

  if (type && TRANSPARENT.has(type)) return convertSequence(kids(node));
  if (type === 'mrow') return convertSequence(kids(node));

  switch (type) {
    case 'mn':
    case 'mi':
    case 'mtext': {
      const text = textOf(node);
      return text.length ? [new MathRun(text)] : [];
    }

    case 'mo': {
      const text = textOf(node);
      if (!text.length || [...text].every((ch) => INVISIBLE.has(ch))) return [];
      return [new MathRun(text)];
    }

    case 'mspace':
      return [];

    case 'mfrac': {
      // Temml marks \binom as a zero-thickness fraction. docx cannot suppress
      // the bar, so refuse instead of drawing a fraction that means something else.
      const thickness = node.attributes?.linethickness;
      if (thickness !== undefined && /^0(\D|$)/.test(thickness)) refuse(UNSUPPORTED.binomial);
      const c = kids(node);
      if (c.length !== 2) refuse('A fraction must have exactly a numerator and a denominator.');
      return [
        new MathFraction({
          numerator: convertSequence([c[0]]),
          denominator: convertSequence([c[1]]),
        }),
      ];
    }

    case 'msqrt':
      return [new MathRadical({ children: convertSequence(kids(node)) })];

    case 'mroot': {
      const c = kids(node);
      if (c.length !== 2) refuse('A root must have exactly a radicand and a degree.');
      return [
        new MathRadical({
          children: convertSequence([c[0]]),
          degree: convertSequence([c[1]]),
        }),
      ];
    }

    case 'msub':
    case 'msup':
    case 'msubsup':
    case 'munder':
    case 'mover':
    case 'munderover': {
      const script = asScript(node);
      if (!script) refuse(`Malformed ${type}.`);
      const base = scriptBase(script.base);

      // munder/mover on a non-operator base is an accent (\hat, \vec, \overline).
      if (type === 'mover' || type === 'munder' || type === 'munderover') {
        if (!nAryKind(base) && !limitFunctionName(base)) refuse(UNSUPPORTED.accent);
      }

      const children = convertSequence([script.base]);
      if (script.sub && script.sup) {
        return [
          new MathSubSuperScript({
            children,
            subScript: convertSequence([script.sub]),
            superScript: convertSequence([script.sup]),
          }),
        ];
      }
      if (script.sub) return [new MathSubScript({ children, subScript: convertSequence([script.sub]) })];
      if (script.sup) return [new MathSuperScript({ children, superScript: convertSequence([script.sup]) })];
      return children;
    }

    case 'menclose':
      refuse(UNSUPPORTED.overline);

    case 'mtable':
    case 'mtr':
    case 'mtd':
      refuse(UNSUPPORTED.matrix);

    default:
      refuse(`Unsupported MathML element <${String(type)}>.`);
  }
}

/**
 * Converts a LaTeX string into docx math components.
 *
 * Never throws: unsupported input comes back as `{ ok: false, reason }` so the
 * caller can degrade visibly and log which construct needs support next.
 */
export function latexToMath(latex: string): MathResult {
  const trimmed = latex.trim();
  if (!trimmed) return { ok: false, reason: 'Empty expression.' };

  let tree: MathMLNode;
  try {
    tree = temml.__renderToMathMLTree(trimmed, {
      throwOnError: true,
      displayMode: false,
    }) as MathMLNode;
  } catch (error) {
    return { ok: false, reason: `LaTeX parse error: ${(error as Error).message}` };
  }

  try {
    const children = convertSequence(kids(tree));
    if (!children.length) return { ok: false, reason: 'Expression produced no content.' };
    return { ok: true, children };
  } catch (error) {
    if (error instanceof UnsupportedMath) return { ok: false, reason: error.message };
    return { ok: false, reason: `Conversion failed: ${(error as Error).message}` };
  }
}
