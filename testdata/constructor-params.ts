/**
 * Test file for constructor parameter properties
 */

/**
 * Element with constructor parameter properties
 * @customElement param-element
 */
export class ParamElement extends HTMLElement {
	constructor(
		/** The element's label */
		public label: string = "default",
		/** Read-only identifier */
		public readonly id: string = crypto.randomUUID(),
		/** Private internal value */
		private _value: number = 0,
		/** Protected configuration */
		protected config: object = {},
	) {
		super();
	}

	/**
	 * Get the current value
	 */
	get value(): number {
		return this._value;
	}

	/**
	 * Set a new value
	 */
	set value(v: number) {
		this._value = v;
	}
}

/**
 * Class with mixed constructor patterns
 */
export class MixedConstructor extends HTMLElement {
	/**
	 * Regular property
	 * @attr
	 */
	name: string = "";

	constructor(
		public readonly type: string,
		private secret: string,
	) {
		super();
	}
}
