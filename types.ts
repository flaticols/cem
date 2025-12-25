/**
 * Custom Elements Manifest Types (CEM v2.1.0)
 * @see https://github.com/webcomponents/custom-elements-manifest
 */

export interface Manifest {
	schemaVersion: string;
	readme?: string;
	modules: Module[];
}

export interface Module {
	kind: "javascript-module";
	path: string;
	summary?: string;
	description?: string;
	declarations?: Declaration[];
	exports?: Export[];
	deprecated?: string | boolean;
}

export type Declaration =
	| ClassDeclaration
	| CustomElementDeclaration
	| FunctionDeclaration
	| VariableDeclaration
	| MixinDeclaration;

export interface ClassDeclaration {
	kind: "class";
	name: string;
	summary?: string;
	description?: string;
	superclass?: Reference;
	mixins?: Reference[];
	members?: ClassMember[];
	source?: SourceReference;
	deprecated?: string | boolean;
	typeParameters?: TypeParameter[];
}

export interface CustomElementDeclaration extends ClassDeclaration {
	tagName?: string;
	customElement: true;
	attributes?: Attribute[];
	cssProperties?: CSSCustomProperty[];
	cssParts?: CSSPart[];
	slots?: Slot[];
	events?: Event[];
}

export interface FunctionDeclaration {
	kind: "function";
	name: string;
	summary?: string;
	description?: string;
	parameters?: Parameter[];
	return?: ReturnType;
	typeParameters?: TypeParameter[];
	source?: SourceReference;
	deprecated?: string | boolean;
}

export interface VariableDeclaration {
	kind: "variable";
	name: string;
	summary?: string;
	description?: string;
	type?: Type;
	default?: string;
	source?: SourceReference;
	deprecated?: string | boolean;
	readonly?: boolean;
}

export interface MixinDeclaration {
	kind: "mixin";
	name: string;
	summary?: string;
	description?: string;
	mixins?: Reference[];
	members?: ClassMember[];
	parameters?: Parameter[];
	typeParameters?: TypeParameter[];
	source?: SourceReference;
	deprecated?: string | boolean;
}

export type ClassMember = ClassField | ClassMethod;

export interface ClassField {
	kind: "field";
	name: string;
	summary?: string;
	description?: string;
	privacy?: "public" | "protected" | "private";
	type?: Type;
	default?: string;
	static?: boolean;
	readonly?: boolean;
	source?: SourceReference;
	inheritedFrom?: Reference;
	deprecated?: string | boolean;
	attribute?: string;
	reflects?: boolean;
}

export interface ClassMethod {
	kind: "method";
	name: string;
	summary?: string;
	description?: string;
	privacy?: "public" | "protected" | "private";
	parameters?: Parameter[];
	return?: ReturnType;
	typeParameters?: TypeParameter[];
	static?: boolean;
	source?: SourceReference;
	inheritedFrom?: Reference;
	deprecated?: string | boolean;
}

export interface Reference {
	name: string;
	package?: string;
	module?: string;
}

export interface Type {
	text: string;
	references?: TypeReference[];
}

export interface TypeReference {
	name?: string;
	package?: string;
	module?: string;
	start?: number;
	end?: number;
}

export interface TypeParameter {
	name: string;
	default?: string;
	extends?: string;
	description?: string;
}

export interface Parameter {
	name: string;
	summary?: string;
	description?: string;
	type?: Type;
	default?: string;
	optional?: boolean;
	rest?: boolean;
}

export interface ReturnType {
	type?: Type;
	summary?: string;
	description?: string;
}

export interface Attribute {
	name: string;
	summary?: string;
	description?: string;
	type?: Type;
	default?: string;
	fieldName?: string;
	inheritedFrom?: Reference;
	deprecated?: string | boolean;
}

export interface CSSCustomProperty {
	name: string;
	summary?: string;
	description?: string;
	default?: string;
	syntax?: string;
	inheritedFrom?: Reference;
	deprecated?: string | boolean;
}

export interface CSSPart {
	name: string;
	summary?: string;
	description?: string;
	inheritedFrom?: Reference;
	deprecated?: string | boolean;
}

export interface Slot {
	name: string;
	summary?: string;
	description?: string;
	inheritedFrom?: Reference;
	deprecated?: string | boolean;
}

export interface Event {
	name: string;
	summary?: string;
	description?: string;
	type?: Type;
	inheritedFrom?: Reference;
	deprecated?: string | boolean;
}

export interface Export {
	kind: "js" | "custom-element-definition";
	name: string;
	declaration?: Reference;
	deprecated?: string | boolean;
}

export interface SourceReference {
	href?: string;
}

/**
 * Internal representation of a class during analysis
 */
export interface ClassInfo {
	name: string;
	superClass?: string;
	modulePath: string;
	description?: string;
	tagName?: string;
	isElement: boolean;
	members: ClassMember[];
	attributes: Attribute[];
	events: Event[];
	slots: Slot[];
	cssProperties: CSSCustomProperty[];
	cssParts: CSSPart[];
	typeParameters?: TypeParameter[];
}
