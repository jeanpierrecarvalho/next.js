import { getHydrationErrorStackInfo } from '../../../is-hydration-error'

export type HydrationErrorState = {
  // Hydration warning template format: <message> <serverContent> <clientContent>
  warning?: [string, string, string]
  componentStack?: string
  serverContent?: string
  clientContent?: string
  // React 19 hydration diff format: <notes> <link> <component diff?>
  notes?: string
  reactOutputComponentDiff?: string
}

type NullableText = string | null | undefined

export const hydrationErrorState: HydrationErrorState = {}

// https://github.com/facebook/react/blob/main/packages/react-dom/src/__tests__/ReactDOMHydrationDiff-test.js used as a reference
const htmlTagsWarnings = new Set([
  'In HTML, %s cannot be a child of <%s>.%s\nThis will cause a hydration error.%s',
  'In HTML, %s cannot be a descendant of <%s>.\nThis will cause a hydration error.%s',
  'In HTML, text nodes cannot be a child of <%s>.\nThis will cause a hydration error.',
  "In HTML, whitespace text nodes cannot be a child of <%s>. Make sure you don't have any extra whitespace between tags on each line of your source code.\nThis will cause a hydration error.",
  'Expected server HTML to contain a matching <%s> in <%s>.%s',
  'Did not expect server HTML to contain a <%s> in <%s>.%s',
])
const textAndTagsMismatchWarnings = new Set([
  'Expected server HTML to contain a matching text node for "%s" in <%s>.%s',
  'Did not expect server HTML to contain the text node "%s" in <%s>.%s',
])
const textMismatchWarning =
  'Text content did not match. Server: "%s" Client: "%s"%s'

export const getHydrationWarningType = (
  msg: NullableText
): 'tag' | 'text' | 'text-in-tag' => {
  if (isHtmlTagsWarning(msg)) return 'tag'
  if (isTextInTagsMismatchWarning(msg)) return 'text-in-tag'
  return 'text'
}

const isHtmlTagsWarning = (msg: NullableText) =>
  Boolean(msg && htmlTagsWarnings.has(msg))

const isTextMismatchWarning = (msg: NullableText) => textMismatchWarning === msg
const isTextInTagsMismatchWarning = (msg: NullableText) =>
  Boolean(msg && textAndTagsMismatchWarnings.has(msg))

const isKnownHydrationWarning = (msg: NullableText) =>
  isHtmlTagsWarning(msg) ||
  isTextInTagsMismatchWarning(msg) ||
  isTextMismatchWarning(msg)

export const getReactHydrationDiffSegments = (msg: NullableText) => {
  if (msg) {
    const { message, diff } = getHydrationErrorStackInfo(msg)
    if (message) return [message, diff]
  }
  return undefined
}

/**
 * Patch console.error to capture hydration errors.
 * If any of the knownHydrationWarnings are logged, store the message and component stack.
 * When the hydration runtime error is thrown, the message and component stack are added to the error.
 * This results in a more helpful error message in the error overlay.
 */

export function storeHydrationErrorStateFromConsoleArgs(...args: any[]) {
  const [msg, serverContent, clientContent, componentStack] = args
  if (isKnownHydrationWarning(msg)) {
    hydrationErrorState.warning = [
      // remove the last %s from the message
      msg,
      serverContent,
      clientContent,
    ]
    hydrationErrorState.componentStack = componentStack
    hydrationErrorState.serverContent = serverContent
    hydrationErrorState.clientContent = clientContent
  }
}
