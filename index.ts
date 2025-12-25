/**
 * Custom Elements Manifest Generator
 *
 * A TypeScript-based analyzer for generating Custom Elements Manifest (CEM v2.1.0)
 * from web component source files.
 *
 * @example
 * ```typescript
 * import { Analyzer, type Manifest } from "@flaticols/cem";
 *
 * const files = ["src/my-element.ts"];
 * const analyzer = new Analyzer(files, process.cwd());
 * const manifest: Manifest = analyzer.analyze();
 * ```
 *
 * @module
 */

// Core analyzer
export { Analyzer } from "./analyzer.ts";

// All CEM types
export type {
	Attribute,
	ClassDeclaration,
	ClassField,
	ClassInfo,
	ClassMember,
	ClassMethod,
	CSSCustomProperty,
	CSSPart,
	CustomElementDeclaration,
	Declaration,
	Event,
	Export,
	FunctionDeclaration,
	Manifest,
	MixinDeclaration,
	Module,
	Parameter,
	Reference,
	ReturnType,
	Slot,
	SourceReference,
	Type,
	TypeParameter,
	TypeReference,
	VariableDeclaration,
} from "./types.ts";
