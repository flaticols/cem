/**
 * Custom Elements Manifest Types (CEM v2.1.0)
 *
 * Type definitions for the Custom Elements Manifest specification.
 * @see https://github.com/webcomponents/custom-elements-manifest
 * @module
 */

/**
 * The root manifest object containing all module information.
 * This is the top-level structure of a Custom Elements Manifest file.
 */
export interface Manifest {
	/** The schema version of the manifest (e.g., "2.1.0") */
	schemaVersion: string;
	/** Path to the README file */
	readme?: string;
	/** List of JavaScript modules in the package */
	modules: Module[];
}

/**
 * Represents a JavaScript module containing declarations and exports.
 * Each source file analyzed becomes a module in the manifest.
 */
export interface Module {
	/** Always "javascript-module" */
	kind: "javascript-module";
	/** Path to the module file, relative to the package root */
	path: string;
	/** Brief summary of the module */
	summary?: string;
	/** Full description of the module */
	description?: string;
	/** Declarations (classes, functions, variables) defined in the module */
	declarations?: Declaration[];
	/** Exports from the module */
	exports?: Export[];
	/** Deprecation status or message */
	deprecated?: string | boolean;
}

/**
 * Union type of all possible declaration kinds.
 * A declaration represents a named entity defined in a module.
 */
export type Declaration =
	| ClassDeclaration
	| CustomElementDeclaration
	| FunctionDeclaration
	| VariableDeclaration
	| MixinDeclaration;

/**
 * Represents a class declaration.
 * Contains information about the class structure, inheritance, and members.
 */
export interface ClassDeclaration {
	/** Always "class" */
	kind: "class";
	/** The class name */
	name: string;
	/** Brief summary of the class */
	summary?: string;
	/** Full description of the class */
	description?: string;
	/** Reference to the superclass, if any */
	superclass?: Reference;
	/** References to mixins applied to the class */
	mixins?: Reference[];
	/** Class members (fields and methods) */
	members?: ClassMember[];
	/** Source location reference */
	source?: SourceReference;
	/** Deprecation status or message */
	deprecated?: string | boolean;
	/** Generic type parameters */
	typeParameters?: TypeParameter[];
}

/**
 * Represents a custom element declaration.
 * Extends ClassDeclaration with web component-specific metadata.
 */
export interface CustomElementDeclaration extends ClassDeclaration {
	/** The custom element tag name (e.g., "my-element") */
	tagName?: string;
	/** Always true for custom elements */
	customElement: true;
	/** HTML attributes the element accepts */
	attributes?: Attribute[];
	/** CSS custom properties the element uses */
	cssProperties?: CSSCustomProperty[];
	/** CSS parts exposed by the element */
	cssParts?: CSSPart[];
	/** Slots defined by the element */
	slots?: Slot[];
	/** Events the element dispatches */
	events?: Event[];
}

/**
 * Represents a function declaration.
 * Contains function signature information including parameters and return type.
 */
export interface FunctionDeclaration {
	/** Always "function" */
	kind: "function";
	/** The function name */
	name: string;
	/** Brief summary of the function */
	summary?: string;
	/** Full description of the function */
	description?: string;
	/** Function parameters */
	parameters?: Parameter[];
	/** Return type information */
	return?: ReturnType;
	/** Generic type parameters */
	typeParameters?: TypeParameter[];
	/** Source location reference */
	source?: SourceReference;
	/** Deprecation status or message */
	deprecated?: string | boolean;
}

/**
 * Represents a variable declaration (const, let, var).
 * Used for exported constants, configuration objects, etc.
 */
export interface VariableDeclaration {
	/** Always "variable" */
	kind: "variable";
	/** The variable name */
	name: string;
	/** Brief summary of the variable */
	summary?: string;
	/** Full description of the variable */
	description?: string;
	/** The variable's type */
	type?: Type;
	/** Default/initial value as a string */
	default?: string;
	/** Source location reference */
	source?: SourceReference;
	/** Deprecation status or message */
	deprecated?: string | boolean;
	/** Whether the variable is readonly (const) */
	readonly?: boolean;
}

/**
 * Represents a mixin declaration.
 * Mixins are functions that add functionality to classes.
 */
export interface MixinDeclaration {
	/** Always "mixin" */
	kind: "mixin";
	/** The mixin name */
	name: string;
	/** Brief summary of the mixin */
	summary?: string;
	/** Full description of the mixin */
	description?: string;
	/** Other mixins this mixin applies */
	mixins?: Reference[];
	/** Members added by the mixin */
	members?: ClassMember[];
	/** Mixin function parameters */
	parameters?: Parameter[];
	/** Generic type parameters */
	typeParameters?: TypeParameter[];
	/** Source location reference */
	source?: SourceReference;
	/** Deprecation status or message */
	deprecated?: string | boolean;
}

/**
 * Union type for class members (fields or methods).
 */
export type ClassMember = ClassField | ClassMethod;

/**
 * Represents a class field (property).
 * Includes metadata about type, visibility, and inheritance.
 */
export interface ClassField {
	/** Always "field" */
	kind: "field";
	/** The field name */
	name: string;
	/** Brief summary of the field */
	summary?: string;
	/** Full description of the field */
	description?: string;
	/** Visibility: public, protected, or private */
	privacy?: "public" | "protected" | "private";
	/** The field's type */
	type?: Type;
	/** Default value as a string */
	default?: string;
	/** Whether this is a static field */
	static?: boolean;
	/** Whether this is a readonly field */
	readonly?: boolean;
	/** Source location reference */
	source?: SourceReference;
	/** Reference to the class where this field was originally defined */
	inheritedFrom?: Reference;
	/** Deprecation status or message */
	deprecated?: string | boolean;
	/** Associated HTML attribute name */
	attribute?: string;
	/** Whether the property reflects to an attribute */
	reflects?: boolean;
}

/**
 * Represents a class method.
 * Includes signature information and metadata.
 */
export interface ClassMethod {
	/** Always "method" */
	kind: "method";
	/** The method name */
	name: string;
	/** Brief summary of the method */
	summary?: string;
	/** Full description of the method */
	description?: string;
	/** Visibility: public, protected, or private */
	privacy?: "public" | "protected" | "private";
	/** Method parameters */
	parameters?: Parameter[];
	/** Return type information */
	return?: ReturnType;
	/** Generic type parameters */
	typeParameters?: TypeParameter[];
	/** Whether this is a static method */
	static?: boolean;
	/** Source location reference */
	source?: SourceReference;
	/** Reference to the class where this method was originally defined */
	inheritedFrom?: Reference;
	/** Deprecation status or message */
	deprecated?: string | boolean;
}

/**
 * A reference to another declaration.
 * Used for superclasses, mixins, and inheritedFrom references.
 */
export interface Reference {
	/** The name of the referenced declaration */
	name: string;
	/** The npm package name, if external */
	package?: string;
	/** The module path within the package */
	module?: string;
}

/**
 * Represents a TypeScript type.
 * Contains the type text and optional references to named types.
 */
export interface Type {
	/** The type as a string (e.g., "string | number") */
	text: string;
	/** References to named types within the type text */
	references?: TypeReference[];
}

/**
 * A reference to a type within a Type's text.
 * Includes position information for linking.
 */
export interface TypeReference {
	/** The type name */
	name?: string;
	/** The npm package name, if external */
	package?: string;
	/** The module path within the package */
	module?: string;
	/** Start position in the type text */
	start?: number;
	/** End position in the type text */
	end?: number;
}

/**
 * Represents a generic type parameter.
 * Used in generic classes, functions, and methods.
 */
export interface TypeParameter {
	/** The type parameter name (e.g., "T") */
	name: string;
	/** Default type if not specified */
	default?: string;
	/** Type constraint (extends clause) */
	extends?: string;
	/** Description of the type parameter */
	description?: string;
}

/**
 * Represents a function or method parameter.
 */
export interface Parameter {
	/** The parameter name */
	name: string;
	/** Brief summary of the parameter */
	summary?: string;
	/** Full description of the parameter */
	description?: string;
	/** The parameter's type */
	type?: Type;
	/** Default value as a string */
	default?: string;
	/** Whether the parameter is optional */
	optional?: boolean;
	/** Whether this is a rest parameter (...args) */
	rest?: boolean;
}

/**
 * Represents a function or method return type.
 */
export interface ReturnType {
	/** The return type */
	type?: Type;
	/** Brief summary of the return value */
	summary?: string;
	/** Full description of the return value */
	description?: string;
}

/**
 * Represents an HTML attribute on a custom element.
 */
export interface Attribute {
	/** The attribute name */
	name: string;
	/** Brief summary of the attribute */
	summary?: string;
	/** Full description of the attribute */
	description?: string;
	/** The attribute's type */
	type?: Type;
	/** Default value as a string */
	default?: string;
	/** The property name this attribute maps to */
	fieldName?: string;
	/** Reference to the class where this attribute was originally defined */
	inheritedFrom?: Reference;
	/** Deprecation status or message */
	deprecated?: string | boolean;
}

/**
 * Represents a CSS custom property (CSS variable) used by a custom element.
 */
export interface CSSCustomProperty {
	/** The CSS property name (e.g., "--my-color") */
	name: string;
	/** Brief summary of the property */
	summary?: string;
	/** Full description of the property */
	description?: string;
	/** Default value */
	default?: string;
	/** CSS syntax definition */
	syntax?: string;
	/** Reference to the class where this property was originally defined */
	inheritedFrom?: Reference;
	/** Deprecation status or message */
	deprecated?: string | boolean;
}

/**
 * Represents a CSS part exposed by a custom element.
 * CSS parts can be styled from outside the shadow DOM using ::part().
 */
export interface CSSPart {
	/** The part name */
	name: string;
	/** Brief summary of the part */
	summary?: string;
	/** Full description of the part */
	description?: string;
	/** Reference to the class where this part was originally defined */
	inheritedFrom?: Reference;
	/** Deprecation status or message */
	deprecated?: string | boolean;
}

/**
 * Represents a slot defined by a custom element.
 * Slots allow light DOM content to be projected into the shadow DOM.
 */
export interface Slot {
	/** The slot name (empty string for default slot) */
	name: string;
	/** Brief summary of the slot */
	summary?: string;
	/** Full description of the slot */
	description?: string;
	/** Reference to the class where this slot was originally defined */
	inheritedFrom?: Reference;
	/** Deprecation status or message */
	deprecated?: string | boolean;
}

/**
 * Represents an event dispatched by a custom element.
 */
export interface Event {
	/** The event name */
	name: string;
	/** Brief summary of the event */
	summary?: string;
	/** Full description of the event */
	description?: string;
	/** The event type (e.g., CustomEvent<T>) */
	type?: Type;
	/** Reference to the class where this event was originally defined */
	inheritedFrom?: Reference;
	/** Deprecation status or message */
	deprecated?: string | boolean;
}

/**
 * Represents an export from a module.
 */
export interface Export {
	/** The export kind: "js" for JavaScript exports, "custom-element-definition" for customElements.define() */
	kind: "js" | "custom-element-definition";
	/** The exported name */
	name: string;
	/** Reference to the declaration being exported */
	declaration?: Reference;
	/** Deprecation status or message */
	deprecated?: string | boolean;
}

/**
 * Reference to source code location.
 */
export interface SourceReference {
	/** URL or path to the source file */
	href?: string;
}

/**
 * Internal representation of a class during analysis.
 * Used by the Analyzer to track class information before generating the manifest.
 */
export interface ClassInfo {
	/** The class name */
	name: string;
	/** Name of the superclass, if any */
	superClass?: string;
	/** Module path where the class is defined */
	modulePath: string;
	/** Class description from JSDoc */
	description?: string;
	/** Custom element tag name */
	tagName?: string;
	/** Whether this class is a custom element */
	isElement: boolean;
	/** Class members (fields and methods) */
	members: ClassMember[];
	/** HTML attributes */
	attributes: Attribute[];
	/** Events dispatched by the element */
	events: Event[];
	/** Slots defined by the element */
	slots: Slot[];
	/** CSS custom properties */
	cssProperties: CSSCustomProperty[];
	/** CSS parts */
	cssParts: CSSPart[];
	/** Generic type parameters */
	typeParameters?: TypeParameter[];
}
