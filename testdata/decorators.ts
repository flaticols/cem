/**
 * Test file for decorator-based custom element definitions
 */

// Decorator stubs for testing
function customElement(tagName: string) {
	return (target: unknown) => target;
}

function property(options?: { attribute?: boolean | string }) {
	return (target: unknown, propertyKey: string) => {};
}

/**
 * Element defined using @customElement decorator
 */
@customElement("decorated-element")
export class DecoratedElement extends HTMLElement {
	/**
	 * Primary color for the element
	 */
	@property()
	color: string = "blue";

	/**
	 * Size of the element
	 */
	@property({ attribute: "element-size" })
	size: "small" | "medium" | "large" = "medium";

	/**
	 * Internal state (no attribute)
	 */
	@property({ attribute: false })
	internalState: object = {};

	/**
	 * Count value
	 */
	@property()
	count: number = 0;
}

/**
 * Another decorated element with different patterns
 */
@customElement("fancy-button")
export class FancyButton extends HTMLElement {
	@property()
	variant: "primary" | "secondary" = "primary";

	@property()
	disabled: boolean = false;
}
