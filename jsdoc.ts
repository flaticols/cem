/**
 * JSDoc parsing utilities
 */

import ts from "typescript";
import type { ClassInfo, Parameter, TypeParameter } from "./types.ts";

/**
 * Parsed JSDoc information
 */
export interface JSDocInfo {
	description?: string;
	deprecated?: string | boolean;
	returns?: string;
	params: Map<string, string>;
	tags: Map<string, string[]>;
}

/**
 * Parse JSDoc from a TypeScript node
 */
export function getJSDoc(node: ts.Node, sourceFile: ts.SourceFile): JSDocInfo {
	const result: JSDocInfo = {
		description: undefined,
		deprecated: undefined,
		returns: undefined,
		params: new Map<string, string>(),
		tags: new Map<string, string[]>(),
	};

	const jsDocs = ts.getJSDocCommentsAndTags(node);

	for (const jsDoc of jsDocs) {
		if (ts.isJSDoc(jsDoc)) {
			if (jsDoc.comment) {
				result.description = ts.getTextOfJSDocComment(jsDoc.comment);
			}

			if (jsDoc.tags) {
				for (const tag of jsDoc.tags) {
					const tagName = tag.tagName.text;
					const comment = tag.comment ? ts.getTextOfJSDocComment(tag.comment) : "";

					if (tagName === "deprecated") {
						result.deprecated = comment || true;
					} else if (tagName === "returns" || tagName === "return") {
						result.returns = comment;
					} else if (tagName === "param" && ts.isJSDocParameterTag(tag)) {
						const paramName = tag.name.getText(sourceFile);
						result.params.set(paramName, comment ?? "");
					} else {
						const existing = result.tags.get(tagName) ?? [];
						existing.push(comment ?? "");
						result.tags.set(tagName, existing);
					}
				}
			}
		}
	}

	return result;
}

/**
 * Parse tag content in format "name - description" or "name description"
 */
export function parseTagContent(content: string): { name: string; description: string } {
	const parts = content.split(/\s+/);
	const name = parts[0] ?? "";
	const description = parts.slice(1).join(" ").replace(/^-\s*/, "");
	return { name, description };
}

/**
 * Extract custom element tag name from JSDoc or decorators
 */
export function extractTagName(node: ts.ClassDeclaration, jsDoc: JSDocInfo): string | undefined {
	// Check @customElement JSDoc tag
	const customElementTags = jsDoc.tags.get("customElement");
	if (customElementTags?.[0]) {
		return customElementTags[0].trim();
	}

	// Check decorators
	const decorators = ts.getDecorators(node);
	if (decorators) {
		for (const decorator of decorators) {
			if (ts.isCallExpression(decorator.expression)) {
				const expr = decorator.expression.expression;
				if (ts.isIdentifier(expr)) {
					const name = expr.text;
					if (name === "customElement" || name === "define") {
						const arg = decorator.expression.arguments[0];
						if (arg && ts.isStringLiteral(arg)) {
							return arg.text;
						}
					}
				}
			}
		}
	}

	return undefined;
}

/**
 * Extract attribute name from JSDoc @attr tag or @property decorator
 */
export function extractAttributeName(
	node: ts.Node,
	jsDoc: JSDocInfo,
	propName: string,
): string | undefined {
	// Check @attr JSDoc tag
	const attrTags = jsDoc.tags.get("attr") ?? jsDoc.tags.get("attribute");
	if (attrTags) {
		const value = attrTags[0]?.trim();
		return value || toKebabCase(propName);
	}

	// Check @property decorator
	if (ts.isPropertyDeclaration(node) || ts.isGetAccessor(node)) {
		const decorators = ts.getDecorators(node);
		if (decorators) {
			for (const decorator of decorators) {
				if (ts.isCallExpression(decorator.expression)) {
					const expr = decorator.expression.expression;
					if (ts.isIdentifier(expr) && expr.text === "property") {
						// Check for attribute: false
						const arg = decorator.expression.arguments[0];
						if (arg && ts.isObjectLiteralExpression(arg)) {
							for (const prop of arg.properties) {
								if (
									ts.isPropertyAssignment(prop) &&
									ts.isIdentifier(prop.name) &&
									prop.name.text === "attribute" &&
									prop.initializer.kind === ts.SyntaxKind.FalseKeyword
								) {
									return undefined;
								}
							}
						}
						return toKebabCase(propName);
					}
				}
			}
		}
	}

	return undefined;
}

/**
 * Extract events, slots, CSS properties, and CSS parts from JSDoc tags
 */
export function extractJSDocTags(jsDoc: JSDocInfo, classInfo: ClassInfo): void {
	// @fires / @event
	const fires = jsDoc.tags.get("fires") ?? jsDoc.tags.get("event") ?? [];
	for (const fire of fires) {
		const { name, description } = parseTagContent(fire);
		if (name) {
			classInfo.events.push({ name, description: description || undefined });
		}
	}

	// @slot
	const slots = jsDoc.tags.get("slot") ?? [];
	for (const slot of slots) {
		const parts = slot.split(/\s+/);
		let slotName = "";
		let description = slot;
		if (parts[0] !== "-") {
			slotName = parts[0] ?? "";
			description = parts.slice(1).join(" ").replace(/^-\s*/, "");
		}
		classInfo.slots.push({ name: slotName, description: description || undefined });
	}

	// @cssProperty
	const cssProps = jsDoc.tags.get("cssProperty") ?? jsDoc.tags.get("cssproperty") ?? [];
	for (const prop of cssProps) {
		const { name, description } = parseTagContent(prop);
		if (name) {
			classInfo.cssProperties.push({ name, description: description || undefined });
		}
	}

	// @cssPart
	const cssParts = jsDoc.tags.get("cssPart") ?? jsDoc.tags.get("csspart") ?? [];
	for (const part of cssParts) {
		const { name, description } = parseTagContent(part);
		if (name) {
			classInfo.cssParts.push({ name, description: description || undefined });
		}
	}
}

/**
 * Extract function/method parameters
 */
export function extractParameters(
	params: ts.NodeArray<ts.ParameterDeclaration>,
	jsDoc: JSDocInfo,
	sourceFile: ts.SourceFile,
): Parameter[] {
	return params.map((param) => {
		const name = ts.isIdentifier(param.name) ? param.name.text : "unknown";

		const p: Parameter = {
			name,
			description: jsDoc.params.get(name),
			optional: !!param.questionToken,
			rest: !!param.dotDotDotToken,
		};

		if (param.type) {
			p.type = { text: param.type.getText(sourceFile) };
		}

		if (param.initializer) {
			p.default = param.initializer.getText(sourceFile);
			p.optional = true;
		}

		return p;
	});
}

/**
 * Parse type parameters from TypeScript nodes
 */
export function parseTypeParameters(
	typeParams: ts.NodeArray<ts.TypeParameterDeclaration> | undefined,
	sourceFile: ts.SourceFile,
): TypeParameter[] | undefined {
	if (!typeParams) return undefined;

	return typeParams.map((tp) => ({
		name: tp.name.text,
		extends: tp.constraint ? tp.constraint.getText(sourceFile) : undefined,
		default: tp.default ? tp.default.getText(sourceFile) : undefined,
	}));
}

/**
 * Convert camelCase to kebab-case
 */
export function toKebabCase(str: string): string {
	return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
