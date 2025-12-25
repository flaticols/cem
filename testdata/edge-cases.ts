/**
 * Test file for edge cases and unusual patterns
 */

/**
 * Abstract base class (should not be a custom element)
 */
export abstract class AbstractElement extends HTMLElement {
	abstract render(): string;

	/**
	 * Common method
	 */
	update(): void {
		this.innerHTML = this.render();
	}
}

/**
 * Concrete implementation
 * @customElement concrete-element
 */
export class ConcreteElement extends AbstractElement {
	/**
	 * Content to render
	 * @attr
	 */
	content: string = "";

	render(): string {
		return `<div>${this.content}</div>`;
	}
}

/**
 * Element with complex types
 * @customElement complex-types
 */
export class ComplexTypes extends HTMLElement {
	/**
	 * Union type property
	 * @attr
	 */
	status: "idle" | "loading" | "success" | "error" = "idle";

	/**
	 * Nullable type
	 */
	data: object | null = null;

	/**
	 * Array type
	 */
	items: string[] = [];

	/**
	 * Map type
	 */
	cache: Map<string, unknown> = new Map();

	/**
	 * Function type
	 */
	onUpdate: ((value: unknown) => void) | null = null;

	/**
	 * Method with rest parameters
	 * @param first - First argument
	 * @param rest - Remaining arguments
	 * @returns Combined result
	 */
	combine(first: string, ...rest: string[]): string {
		return [first, ...rest].join("");
	}

	/**
	 * Method with optional parameters
	 * @param required - Required param
	 * @param optional - Optional param
	 * @param withDefault - Param with default
	 */
	process(required: string, optional?: number, withDefault: boolean = true): void {
		console.log(required, optional, withDefault);
	}
}

/**
 * Element extending non-HTMLElement (should still be detected)
 * @customElement lit-like
 */
export class LitLikeElement extends HTMLElement {
	static properties = {
		name: { type: String },
	};

	name: string = "";
}

/**
 * Private class fields with different access patterns
 * @customElement private-fields
 */
export class PrivateFields extends HTMLElement {
	/** Private with # */
	#privateField: number = 0;

	/** Private with keyword */
	private privateKeyword: string = "";

	/** Protected field */
	protected protectedField: boolean = false;

	/** Public field */
	public publicField: object = {};

	get privateValue(): number {
		return this.#privateField;
	}

	set privateValue(v: number) {
		this.#privateField = v;
	}
}

// Re-export pattern
export { ConcreteElement as AliasedElement };
