/**
 * Inheritance resolution utilities
 */

import type {
	Attribute,
	ClassInfo,
	ClassMember,
	CSSCustomProperty,
	CSSPart,
	Event,
	Reference,
	Slot,
} from "./types.ts";

/**
 * Item that can be inherited (has a name property)
 */
interface Inheritable {
	name: string;
	inheritedFrom?: Reference;
}

/**
 * Copy inherited items from superclass to subclass
 * Only copies items that don't already exist in the subclass
 */
function copyInheritedItems<T extends Inheritable>(
	target: T[],
	source: T[],
	superClass: { name: string; modulePath: string },
): void {
	const existing = new Set(target.map((item) => item.name));

	for (const item of source) {
		if (!existing.has(item.name)) {
			target.push({
				...item,
				inheritedFrom: {
					name: superClass.name,
					module: superClass.modulePath,
				},
			} as T);
		}
	}
}

/**
 * Resolve inheritance for a single class
 * Uses depth-first traversal with cycle detection
 */
export function resolveClassInheritance(
	classInfo: ClassInfo,
	classes: Map<string, ClassInfo>,
	visited: Set<string>,
): void {
	if (visited.has(classInfo.name)) return;
	visited.add(classInfo.name);

	if (!classInfo.superClass) return;

	const superClass = classes.get(classInfo.superClass);
	if (!superClass) return;

	// Resolve superclass first (depth-first)
	resolveClassInheritance(superClass, classes, visited);

	// Copy inherited members
	copyInheritedItems<ClassMember>(classInfo.members, superClass.members, superClass);

	// Copy inherited attributes
	copyInheritedItems<Attribute>(classInfo.attributes, superClass.attributes, superClass);

	// Copy inherited events
	copyInheritedItems<Event>(classInfo.events, superClass.events, superClass);

	// Copy inherited slots
	copyInheritedItems<Slot>(classInfo.slots, superClass.slots, superClass);

	// Copy inherited CSS properties
	copyInheritedItems<CSSCustomProperty>(
		classInfo.cssProperties,
		superClass.cssProperties,
		superClass,
	);

	// Copy inherited CSS parts
	copyInheritedItems<CSSPart>(classInfo.cssParts, superClass.cssParts, superClass);

	// Inherit isElement status if not already set
	if (!classInfo.isElement && superClass.isElement) {
		classInfo.isElement = true;
	}
}

/**
 * Resolve inheritance for all classes in the map
 */
export function resolveAllInheritance(classes: Map<string, ClassInfo>): void {
	for (const classInfo of classes.values()) {
		resolveClassInheritance(classInfo, classes, new Set());
	}
}
