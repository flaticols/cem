/**
 * Test file for standalone functions and variables
 */

/**
 * Default element tag name
 */
export const DEFAULT_TAG = "my-element";

/**
 * Element configuration type
 */
export const CONFIG = {
	version: "1.0.0",
	debug: false,
} as const;

/**
 * Mutable counter
 */
export let instanceCount = 0;

/**
 * Create a custom element
 * @param tagName - The tag name to use
 * @param options - Creation options
 * @returns The created element
 */
export function createElement(
	tagName: string,
	options?: ElementCreationOptions,
): HTMLElement {
	instanceCount++;
	return document.createElement(tagName, options);
}

/**
 * Register a custom element
 * @param name - The element name
 * @param constructor - The element constructor
 * @param options - Registration options
 */
export function registerElement(
	name: string,
	constructor: CustomElementConstructor,
	options?: ElementDefinitionOptions,
): void {
	customElements.define(name, constructor, options);
}

/**
 * Check if an element is defined
 * @param name - The element name to check
 * @returns Whether the element is defined
 * @deprecated Use customElements.get() directly
 */
export function isElementDefined(name: string): boolean {
	return customElements.get(name) !== undefined;
}

/**
 * Create multiple elements
 * @template T - The element type
 * @param tagName - Tag name
 * @param count - Number to create
 * @returns Array of elements
 */
export function createMany<T extends HTMLElement>(tagName: string, count: number): T[] {
	const elements: T[] = [];
	for (let i = 0; i < count; i++) {
		elements.push(document.createElement(tagName) as T);
	}
	return elements;
}
