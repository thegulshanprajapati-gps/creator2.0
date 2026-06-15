import DOMPurify from 'dompurify';

/**
 * Sanitizes raw HTML input using DOMPurify on the client side.
 * Falls back to returning the raw input on the server side to support SSR.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    return html;
  }
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'],
    ADD_ATTR: ['src', 'alt', 'width', 'height', 'frameborder', 'allowfullscreen', 'style', 'class', 'href', 'target'],
  });
}
