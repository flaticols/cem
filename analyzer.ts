/**
 * TypeScript AST Analyzer for Custom Elements Manifest generation.
 *
 * This module provides the core analysis functionality for generating
 * Custom Elements Manifest files from TypeScript/JavaScript source code.
 *
 * @module
 */

import { relative } from "node:path";
import ts from "typescript";
import { resolveAllInheritance } from "./inheritance.ts";
import {
	extractAttributeName,
	extractJSDocTags,
	extractParameters,
	extractTagName,
	getJSDoc,
	type JSDocInfo,
	parseTypeParameters,
} from "./jsdoc.ts";
import type {
	ClassDeclaration,
	ClassField,
	ClassInfo,
	ClassMethod,
	CustomElementDeclaration,
	Declaration,
	FunctionDeclaration,
	Manifest,
	Module,
	VariableDeclaration,
} from "./types.ts";

/** Known base classes for custom elements */
const ELEMENT_BASE_CLASSES = new Set(["HTMLElement", "LitElement", "FASTElement"]);

/**
 * Analyzes TypeScript/JavaScript source files to generate a Custom Elements Manifest.
 *
 * The Analyzer uses the TypeScript Compiler API to parse source files, extract
 * class declarations, and resolve inheritance chains. It supports:
 * - Class declarations with inheritance
 * - Custom element detection via decorators or JSDoc
 * - JSDoc tag extraction (@attr, @fires, @slot, @cssProperty, @cssPart)
 * - Type information from TypeScript annotations
 *
 * @example
 * ```typescript
 * const analyzer = new Analyzer(["src/my-element.ts"], process.cwd());
 * const manifest = analyzer.analyze();
 * console.log(JSON.stringify(manifest, null, 2));
 * ```
 */
export class Analyzer {
	private program: ts.Program;
	private classes = new Map<string, ClassInfo>();
	private modules = new Map<string, Module>();
	private baseDir: string;

	/**
	 * Creates a new Analyzer instance.
	 *
	 * @param files - Array of file paths to analyze
	 * @param baseDir - Base directory for resolving relative paths in the manifest
	 */
	constructor(files: string[], baseDir: string) {
		this.baseDir = baseDir;
		this.program = ts.createProgram(files, {
			target: ts.ScriptTarget.ESNext,
			module: ts.ModuleKind.ESNext,
			allowJs: true,
			checkJs: true,
		});
	}

	/**
	 * Analyzes all source files and generates a Custom Elements Manifest.
	 *
	 * This method performs two passes:
	 * 1. First pass: Collects all class declarations and their members
	 * 2. Second pass: Resolves inheritance chains and copies inherited members
	 *
	 * @returns The generated Custom Elements Manifest object
	 */
	analyze(): Manifest {
		// First pass: collect all classes
		for (const sourceFile of this.program.getSourceFiles()) {
			if (sourceFile.isDeclarationFile) continue;
			this.analyzeSourceFile(sourceFile);
		}

		// Second pass: resolve inheritance
		resolveAllInheritance(this.classes);

		// Update declarations with inherited members
		this.updateDeclarations();

		return {
			schemaVersion: "2.1.0",
			modules: Array.from(this.modules.values()),
		};
	}

	private analyzeSourceFile(sourceFile: ts.SourceFile): void {
		const relativePath = relative(this.baseDir, sourceFile.fileName);
		const module: Module = {
			kind: "javascript-module",
			path: relativePath,
			declarations: [],
			exports: [],
		};
		this.modules.set(relativePath, module);

		ts.forEachChild(sourceFile, (node) => {
			this.visitNode(node, module, sourceFile);
		});
	}

	private visitNode(node: ts.Node, module: Module, sourceFile: ts.SourceFile): void {
		if (ts.isClassDeclaration(node)) {
			this.visitClassDeclaration(node, module, sourceFile);
		} else if (ts.isFunctionDeclaration(node)) {
			this.visitFunctionDeclaration(node, module, sourceFile);
		} else if (ts.isVariableStatement(node)) {
			this.visitVariableStatement(node, module, sourceFile);
		} else if (ts.isExportDeclaration(node)) {
			this.visitExportDeclaration(node, module);
		} else if (ts.isExportAssignment(node)) {
			this.visitExportAssignment(node, module);
		}
	}

	private visitClassDeclaration(
		node: ts.ClassDeclaration,
		module: Module,
		sourceFile: ts.SourceFile,
	): void {
		const name = node.name?.text;
		if (!name) return;

		const jsDoc = getJSDoc(node, sourceFile);
		const classInfo = this.initClassInfo(name, module.path, jsDoc);

		// Extract tag name
		classInfo.tagName = extractTagName(node, jsDoc);

		// Check inheritance
		this.processHeritage(node, classInfo, sourceFile);

		// Mark as element if has tag name
		classInfo.isElement = classInfo.isElement || !!classInfo.tagName;

		// Extract JSDoc tags (events, slots, css)
		extractJSDocTags(jsDoc, classInfo);

		// Extract type parameters
		classInfo.typeParameters = parseTypeParameters(node.typeParameters, sourceFile);

		// Visit members
		for (const member of node.members) {
			this.visitClassMember(member, classInfo, sourceFile);
		}

		this.classes.set(name, classInfo);

		// Create declaration and add exports
		const decl = this.createDeclaration(classInfo);
		module.declarations?.push(decl);

		if (this.isExported(node)) {
			if (classInfo.isElement && classInfo.tagName) {
				module.exports?.push({
					kind: "custom-element-definition",
					name: classInfo.tagName,
					declaration: { name, module: module.path },
				});
			}
			module.exports?.push({
				kind: "js",
				name,
				declaration: { name, module: module.path },
			});
		}
	}

	private initClassInfo(name: string, modulePath: string, jsDoc: JSDocInfo): ClassInfo {
		return {
			name,
			modulePath,
			description: jsDoc.description,
			isElement: false,
			members: [],
			attributes: [],
			events: [],
			slots: [],
			cssProperties: [],
			cssParts: [],
		};
	}

	private processHeritage(
		node: ts.ClassDeclaration,
		classInfo: ClassInfo,
		sourceFile: ts.SourceFile,
	): void {
		if (!node.heritageClauses) return;

		for (const clause of node.heritageClauses) {
			if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
				for (const type of clause.types) {
					const typeName = type.expression.getText(sourceFile);
					classInfo.superClass = typeName;

					// Check if extends an element base class
					if (typeName.endsWith("Element") || ELEMENT_BASE_CLASSES.has(typeName)) {
						classInfo.isElement = true;
					}
				}
			}
		}
	}

	private visitClassMember(
		node: ts.ClassElement,
		classInfo: ClassInfo,
		sourceFile: ts.SourceFile,
	): void {
		if (ts.isPropertyDeclaration(node)) {
			this.visitPropertyDeclaration(node, classInfo, sourceFile);
		} else if (ts.isMethodDeclaration(node)) {
			this.visitMethodDeclaration(node, classInfo, sourceFile);
		} else if (ts.isGetAccessor(node)) {
			this.visitGetAccessor(node, classInfo, sourceFile);
		} else if (ts.isSetAccessor(node)) {
			this.visitSetAccessor(node, classInfo, sourceFile);
		} else if (ts.isConstructorDeclaration(node)) {
			this.visitConstructor(node, classInfo, sourceFile);
		}
	}

	private visitPropertyDeclaration(
		node: ts.PropertyDeclaration,
		classInfo: ClassInfo,
		sourceFile: ts.SourceFile,
	): void {
		const name = this.getPropertyName(node.name);
		if (!name) return;

		const jsDoc = getJSDoc(node, sourceFile);

		const field: ClassField = {
			kind: "field",
			name,
			description: jsDoc.description,
			privacy: this.getPrivacy(node),
			static: this.hasModifier(node, ts.SyntaxKind.StaticKeyword),
			readonly: this.hasModifier(node, ts.SyntaxKind.ReadonlyKeyword),
		};

		if (jsDoc.deprecated) {
			field.deprecated = jsDoc.deprecated;
		}

		if (node.type) {
			field.type = { text: node.type.getText(sourceFile) };
		}

		if (node.initializer) {
			field.default = node.initializer.getText(sourceFile);
		}

		// Check for @attr tag
		const attrName = extractAttributeName(node, jsDoc, name);
		if (attrName) {
			field.attribute = attrName;
			field.reflects = true;

			classInfo.attributes.push({
				name: attrName,
				description: field.description,
				type: field.type,
				default: field.default,
				fieldName: name,
			});
		}

		classInfo.members.push(field);
	}

	private visitMethodDeclaration(
		node: ts.MethodDeclaration,
		classInfo: ClassInfo,
		sourceFile: ts.SourceFile,
	): void {
		const name = this.getPropertyName(node.name);
		if (!name) return;

		const jsDoc = getJSDoc(node, sourceFile);

		const method: ClassMethod = {
			kind: "method",
			name,
			description: jsDoc.description,
			privacy: this.getPrivacy(node),
			static: this.hasModifier(node, ts.SyntaxKind.StaticKeyword),
			parameters: extractParameters(node.parameters, jsDoc, sourceFile),
		};

		if (jsDoc.deprecated) {
			method.deprecated = jsDoc.deprecated;
		}

		if (node.type) {
			method.return = {
				type: { text: node.type.getText(sourceFile) },
				description: jsDoc.returns,
			};
		} else if (jsDoc.returns) {
			method.return = { description: jsDoc.returns };
		}

		method.typeParameters = parseTypeParameters(node.typeParameters, sourceFile);

		classInfo.members.push(method);
	}

	private visitGetAccessor(
		node: ts.GetAccessorDeclaration,
		classInfo: ClassInfo,
		sourceFile: ts.SourceFile,
	): void {
		const name = this.getPropertyName(node.name);
		if (!name) return;

		// Check if we already have this field from a setter
		const existing = classInfo.members.find(
			(m): m is ClassField => m.kind === "field" && m.name === name,
		);
		if (existing) {
			if (node.type && !existing.type) {
				existing.type = { text: node.type.getText(sourceFile) };
			}
			return;
		}

		const jsDoc = getJSDoc(node, sourceFile);

		const field: ClassField = {
			kind: "field",
			name,
			description: jsDoc.description,
			privacy: this.getPrivacy(node),
			static: this.hasModifier(node, ts.SyntaxKind.StaticKeyword),
			readonly: true,
		};

		if (node.type) {
			field.type = { text: node.type.getText(sourceFile) };
		}

		const attrName = extractAttributeName(node, jsDoc, name);
		if (attrName) {
			field.attribute = attrName;
			field.reflects = true;
			classInfo.attributes.push({
				name: attrName,
				description: field.description,
				type: field.type,
				fieldName: name,
			});
		}

		classInfo.members.push(field);
	}

	private visitSetAccessor(
		node: ts.SetAccessorDeclaration,
		classInfo: ClassInfo,
		sourceFile: ts.SourceFile,
	): void {
		const name = this.getPropertyName(node.name);
		if (!name) return;

		// Check if we already have this field from a getter
		const existing = classInfo.members.find(
			(m): m is ClassField => m.kind === "field" && m.name === name,
		);
		if (existing) {
			existing.readonly = false;
			return;
		}

		const jsDoc = getJSDoc(node, sourceFile);

		const field: ClassField = {
			kind: "field",
			name,
			description: jsDoc.description,
			privacy: this.getPrivacy(node),
			static: this.hasModifier(node, ts.SyntaxKind.StaticKeyword),
		};

		if (node.parameters.length > 0) {
			const param = node.parameters[0];
			if (param?.type) {
				field.type = { text: param.type.getText(sourceFile) };
			}
		}

		classInfo.members.push(field);
	}

	private visitConstructor(
		node: ts.ConstructorDeclaration,
		classInfo: ClassInfo,
		sourceFile: ts.SourceFile,
	): void {
		for (const param of node.parameters) {
			if (!this.isParameterProperty(param)) continue;

			const name = ts.isIdentifier(param.name) ? param.name.text : undefined;
			if (!name) continue;

			const jsDoc = getJSDoc(param, sourceFile);

			const field: ClassField = {
				kind: "field",
				name,
				description: jsDoc.description,
				privacy: this.getPrivacy(param),
				readonly: this.hasModifier(param, ts.SyntaxKind.ReadonlyKeyword),
			};

			if (param.type) {
				field.type = { text: param.type.getText(sourceFile) };
			}

			if (param.initializer) {
				field.default = param.initializer.getText(sourceFile);
			}

			classInfo.members.push(field);
		}
	}

	private visitFunctionDeclaration(
		node: ts.FunctionDeclaration,
		module: Module,
		sourceFile: ts.SourceFile,
	): void {
		const name = node.name?.text;
		if (!name) return;

		const jsDoc = getJSDoc(node, sourceFile);

		const decl: FunctionDeclaration = {
			kind: "function",
			name,
			description: jsDoc.description,
			parameters: extractParameters(node.parameters, jsDoc, sourceFile),
		};

		if (jsDoc.deprecated) {
			decl.deprecated = jsDoc.deprecated;
		}

		if (node.type) {
			decl.return = {
				type: { text: node.type.getText(sourceFile) },
				description: jsDoc.returns,
			};
		}

		decl.typeParameters = parseTypeParameters(node.typeParameters, sourceFile);

		module.declarations?.push(decl);

		if (this.isExported(node)) {
			module.exports?.push({
				kind: "js",
				name,
				declaration: { name, module: module.path },
			});
		}
	}

	private visitVariableStatement(
		node: ts.VariableStatement,
		module: Module,
		sourceFile: ts.SourceFile,
	): void {
		const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;

		for (const decl of node.declarationList.declarations) {
			if (!ts.isIdentifier(decl.name)) continue;
			const name = decl.name.text;

			const jsDoc = getJSDoc(node, sourceFile);

			const varDecl: VariableDeclaration = {
				kind: "variable",
				name,
				description: jsDoc.description,
				readonly: isConst,
			};

			if (jsDoc.deprecated) {
				varDecl.deprecated = jsDoc.deprecated;
			}

			if (decl.type) {
				varDecl.type = { text: decl.type.getText(sourceFile) };
			}

			if (decl.initializer) {
				varDecl.default = decl.initializer.getText(sourceFile);
			}

			module.declarations?.push(varDecl);

			if (this.isExported(node)) {
				module.exports?.push({
					kind: "js",
					name,
					declaration: { name, module: module.path },
				});
			}
		}
	}

	private visitExportDeclaration(node: ts.ExportDeclaration, module: Module): void {
		if (!node.exportClause || !ts.isNamedExports(node.exportClause)) return;

		for (const element of node.exportClause.elements) {
			const exportName = element.name.text;
			const localName = element.propertyName?.text ?? exportName;

			module.exports?.push({
				kind: "js",
				name: exportName,
				declaration: { name: localName, module: module.path },
			});
		}
	}

	private visitExportAssignment(node: ts.ExportAssignment, module: Module): void {
		const name = ts.isIdentifier(node.expression) ? node.expression.text : "default";

		module.exports?.push({
			kind: "js",
			name: "default",
			declaration: { name, module: module.path },
		});
	}

	private updateDeclarations(): void {
		for (const module of this.modules.values()) {
			if (!module.declarations) continue;

			for (let i = 0; i < module.declarations.length; i++) {
				const decl = module.declarations[i];
				if (decl?.kind === "class") {
					const classInfo = this.classes.get(decl.name);
					if (classInfo) {
						module.declarations[i] = this.createDeclaration(classInfo);
					}
				}
			}
		}
	}

	private createDeclaration(classInfo: ClassInfo): Declaration {
		if (classInfo.isElement) {
			const decl: CustomElementDeclaration = {
				kind: "class",
				name: classInfo.name,
				customElement: true,
				description: classInfo.description,
				members: classInfo.members.length > 0 ? classInfo.members : undefined,
				typeParameters: classInfo.typeParameters,
			};

			if (classInfo.tagName) decl.tagName = classInfo.tagName;
			if (classInfo.superClass) {
				decl.superclass = { name: classInfo.superClass };
			}
			if (classInfo.attributes.length > 0) {
				decl.attributes = classInfo.attributes;
			}
			if (classInfo.events.length > 0) {
				decl.events = classInfo.events;
			}
			if (classInfo.slots.length > 0) {
				decl.slots = classInfo.slots;
			}
			if (classInfo.cssProperties.length > 0) {
				decl.cssProperties = classInfo.cssProperties;
			}
			if (classInfo.cssParts.length > 0) {
				decl.cssParts = classInfo.cssParts;
			}

			return decl;
		}

		const decl: ClassDeclaration = {
			kind: "class",
			name: classInfo.name,
			description: classInfo.description,
			members: classInfo.members.length > 0 ? classInfo.members : undefined,
			typeParameters: classInfo.typeParameters,
		};

		if (classInfo.superClass) {
			decl.superclass = { name: classInfo.superClass };
		}

		return decl;
	}

	// Helpers

	private getPropertyName(node: ts.PropertyName): string | undefined {
		if (ts.isIdentifier(node)) return node.text;
		if (ts.isStringLiteral(node)) return node.text;
		if (ts.isNumericLiteral(node)) return node.text;
		if (ts.isPrivateIdentifier(node)) return node.text;
		return undefined;
	}

	private hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
		const modifiers = ts.getModifiers(node as ts.HasModifiers);
		return modifiers?.some((m) => m.kind === kind) ?? false;
	}

	private getPrivacy(node: ts.Node): "public" | "protected" | "private" | undefined {
		if (this.hasModifier(node, ts.SyntaxKind.PrivateKeyword)) return "private";
		if (this.hasModifier(node, ts.SyntaxKind.ProtectedKeyword)) return "protected";

		// Check for private identifier (#name)
		if (
			(ts.isPropertyDeclaration(node) ||
				ts.isMethodDeclaration(node) ||
				ts.isGetAccessor(node) ||
				ts.isSetAccessor(node)) &&
			ts.isPrivateIdentifier(node.name)
		) {
			return "private";
		}

		return undefined;
	}

	private isExported(node: ts.Node): boolean {
		return this.hasModifier(node, ts.SyntaxKind.ExportKeyword);
	}

	private isParameterProperty(node: ts.ParameterDeclaration): boolean {
		return (
			this.hasModifier(node, ts.SyntaxKind.PublicKeyword) ||
			this.hasModifier(node, ts.SyntaxKind.PrivateKeyword) ||
			this.hasModifier(node, ts.SyntaxKind.ProtectedKeyword) ||
			this.hasModifier(node, ts.SyntaxKind.ReadonlyKeyword)
		);
	}
}
