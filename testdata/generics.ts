/**
 * Test file for generic classes and methods
 */

/**
 * Generic container element
 * @customElement generic-container
 * @template T - The type of items in the container
 */
export class GenericContainer<T> extends HTMLElement {
	/**
	 * Items stored in the container
	 */
	items: T[] = [];

	/**
	 * Add an item to the container
	 * @param item - The item to add
	 */
	add(item: T): void {
		this.items.push(item);
	}

	/**
	 * Get item at index
	 * @param index - The index to retrieve
	 * @returns The item at the given index
	 */
	get(index: number): T | undefined {
		return this.items[index];
	}

	/**
	 * Transform all items
	 * @template U - The output type
	 * @param fn - Transformation function
	 * @returns Transformed items
	 */
	map<U>(fn: (item: T) => U): U[] {
		return this.items.map(fn);
	}
}

/**
 * Generic element with constraints
 * @customElement typed-list
 * @template T - Must have an id property
 */
export class TypedList<T extends { id: string }> extends HTMLElement {
	/**
	 * List data
	 */
	data: T[] = [];

	/**
	 * Find by ID
	 * @param id - The ID to find
	 * @returns The matching item
	 */
	findById(id: string): T | undefined {
		return this.data.find((item) => item.id === id);
	}
}

/**
 * Generic with default type
 * @customElement default-generic
 */
export class DefaultGeneric<T = string> extends HTMLElement {
	value: T | null = null;
}
