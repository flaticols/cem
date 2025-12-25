/**
 * Test file for static members
 */

/**
 * Element with static properties and methods
 * @customElement static-element
 */
export class StaticElement extends HTMLElement {
	/**
	 * Element version
	 */
	static readonly VERSION = "1.0.0";

	/**
	 * Default configuration
	 */
	static defaultConfig: {
		theme: string;
		size: number;
	} = {
		theme: "light",
		size: 16,
	};

	/**
	 * Registry of all instances
	 */
	private static instances: StaticElement[] = [];

	/**
	 * Register an instance
	 * @param instance - The instance to register
	 */
	static register(instance: StaticElement): void {
		StaticElement.instances.push(instance);
	}

	/**
	 * Get all instances
	 * @returns All registered instances
	 */
	static getInstances(): StaticElement[] {
		return [...StaticElement.instances];
	}

	/**
	 * Create element with options
	 * @param options - Creation options
	 * @returns New element instance
	 */
	static create(options?: { id?: string }): StaticElement {
		const el = new StaticElement();
		if (options?.id) {
			el.id = options.id;
		}
		return el;
	}

	/**
	 * Instance property
	 * @attr
	 */
	name: string = "";

	connectedCallback(): void {
		StaticElement.register(this);
	}
}
