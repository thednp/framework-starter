import { type Accessor, effect } from "./state";
import { namespaceElements } from "./ns";

type DOMElement = HTMLElement | SVGElement | MathMLElement;
type TagNames = keyof HTMLElementTagNameMap | keyof MathMLElementTagNameMap | keyof SVGElementTagNameMap;
type Primitive = string | number | boolean | null | undefined;
type PropValueOrAccessor = Primitive | Accessor<unknown>;

type DOMNodeAttributes<T extends DOMElement> = PropsWithKnownKeys<T> & {
  class?: PropValueOrAccessor;
  is?: string;
  [key: `data-${string}`]: Primitive | Accessor<Primitive>;
  [key: `aria-${string}`]: string | Accessor<string>;
};

type PropsWithKnownKeys<T> = Partial<{
  [K in keyof T]: PropValueOrAccessor;
}>;

export type MaybeChildNode = number | string | Node | MaybeChildNode[] | Accessor<string | number | Node>;

/**
 * Sets or removes an attribute with the specified or inferred namespace on an element.
 *
 * @param ns - The namespace URI (e.g., 'http://www.w3.org/2000/svg') or null to infer from element.
 * @param element - The DOM element to modify.
 * @param key - The attribute name (e.g., 'stroke-width', 'xlink:href').
 * @param value - The attribute value; falsy values remove the attribute.
 */
export const setOrRemoveAttr = (ns: string | null, element: Element, key: string, rawValue: PropValueOrAccessor) => {
  const value = typeof rawValue === "function" ? rawValue() : rawValue;
  // Infer namespace from element if ns is null
  const elementNS = ns || element.namespaceURI || null;

  // Map attributes to specific namespaces
  const attrNamespaces = {
    // "": "http://www.w3.org/1999/xhtml", // HTMLElement
    "xlink:": "http://www.w3.org/1999/xlink", // XLink attributes (e.g., xlink:href)
    "xml:": "http://www.w3.org/XML/1998/namespace", // XML attributes (e.g., xml:lang)
    "xsi:": "http://www.w3.org/2001/XMLSchema-instance", // XML Schema Instance (e.g., xsi:schemaLocation)
  };

  // Determine attribute namespace
  let attrNS = elementNS;
  for (const [prefix, uri] of Object.entries(attrNamespaces)) {
    if (key.startsWith(prefix)) {
      attrNS = uri;
      break;
    }
  }
  attrNS = attrNS === "http://www.w3.org/1999/xhtml" ? null : attrNS;

  if (value == null || value === false || value === "" || value === undefined) {
    // Remove attribute
    try {
      if (attrNS && attrNS !== "null") {
        // Strip prefix (e.g., xlink:href -> href)
        element.removeAttributeNS(attrNS, key.replace(/^[^:]+:/, ""));
      } else {
        element.removeAttribute(key);
        element.removeAttribute(key.replace(/^[^:]+:/, ""));
      }
    } catch (_e) {
      // Silent fail: attribute may not exist
    }
  } else {
    // Set attribute
    const attr = value === true ? key.replace(/^[^:]+:/, "") : String(value);
    try {
      element.setAttributeNS(attrNS, key, attr);
    } catch (_e) {
      // Fallback to non-namespaced set
      element.setAttribute(key, attr);
    }
  }
};

// Append children
export const add = (parent: ParentNode, child: MaybeChildNode) => {
  if (Array.isArray(child)) {
    child.forEach(c => add(parent, c));
  } else if (child instanceof Node) {
    parent.appendChild(child);
  } else if (typeof child === "function") {
    const textNode = document.createTextNode("");
    effect(() => {
      textNode.textContent = String(child());
    });
    parent.appendChild(textNode);
  } else if (typeof child === "number" || typeof child === "string") {
    parent.appendChild(document.createTextNode(String(child)));
  }
};

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  props?: DOMNodeAttributes<HTMLElementTagNameMap[K]> | MaybeChildNode,
  ...children: MaybeChildNode[]
): HTMLElementTagNameMap[K];

export function createElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  props?: DOMNodeAttributes<SVGElementTagNameMap[K]> | MaybeChildNode,
  ...children: MaybeChildNode[]
): SVGElementTagNameMap[K];

export function createElement<K extends keyof MathMLElementTagNameMap>(
  tagName: K,
  props?: DOMNodeAttributes<MathMLElementTagNameMap[K]> | MaybeChildNode,
  ...children: MaybeChildNode[]
): MathMLElementTagNameMap[K];

export function createElement<K extends TagNames>(
  tagName: K,
  first?: DOMNodeAttributes<DOMElement> | MaybeChildNode,
  ...children: MaybeChildNode[]
) {
  const ns = namespaceElements[tagName];
  const element = ns
    ? document.createElementNS(ns, tagName)
    : document.createElement(tagName);

  // Handle props if first is an object and not a Node
  if (first && typeof first === "object" && !(first instanceof Node)) {
    Object.entries(first).forEach(([key, value]) => {
      if (key.startsWith("on")) {
        if (typeof value !== "function") {
          console.warn(`The "${key}" property "${value}" is not a function.`);
          return;
        }
        const eventName = key.slice(2).toLowerCase();
        element.removeEventListener(eventName, value);
        element.addEventListener(eventName, value);
        // cleanupFns.push(() => element.removeEventListener(eventName, value));
      } else {
        const attrNamespace = key === "xmlns" ? null : element.namespaceURI;

        // Handle reactive props with effect
        effect(() => {
          setOrRemoveAttr(attrNamespace, element, key, value)
        });
      }
    });
  }

  if (first && (typeof first === "function" || typeof first === "string" || first instanceof Node || Array.isArray(first))) {
    add(element, first);
  }
  children.forEach(c => add(element, c));

  // Cleanup function to remove event listeners
  // cleanupFns.forEach(fn => fn());

  return element;
}