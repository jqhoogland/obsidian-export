import { visit } from "unist-util-visit";
import { Code, Root } from "mdast";
import { heading, listItem, table, tableCell, tableRow } from "mdast-builder";
import { u } from "unist-builder";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import { map } from "unist-util-map";
import { DataviewAPI, LiteralValue } from "obsidian-dataview";
import { Properties } from "hast";


interface DataviewAPIExtended extends DataviewAPI {
	el: (tag: string, text: string) => Node,
	header: (level: number, text: string) => Node,
	span: (text: string) => Node,
	paragraph: (text: string) => Node,
	list: (elements: string[]) => Node,
	table: (headers: string[], elements: string[][]) => Node,
	export: true
}

const processor = unified().use(rehypeParse, { fragment: true }) // .use(rehypeRemark)

interface CleanedNode extends Node {
	clean: (any) => Node;
	data: any,
	tagName: string,
	properties: Properties
}

/**
 * Mock dv's rendering functions.
 * Instead of writing elements to the document, render as html strings.
 *
 * @param dv
 */
const addCodeblockProcessors = (dv: Partial<DataviewAPIExtended>): Partial<DataviewAPIExtended> => {
	const clean = (value: any) => {
		if (typeof value === "string") {
			const _res = processor.parse(`<div>${value}</div>`)
			// @ts-ignore
			const res = map(_res, (node: CleanedNode) =>
				Object.assign({}, node, {
					// @ts-ignore
					data: {
						...node?.data,
						hName: node.tagName,
						hProperties: node.properties
					}
				})
			)
			// @ts-ignore
			return res.children ?? u("text", value)
		}
		return value
	}

	dv.clean = clean

	// @ts-ignore
	dv.el = (tag: string, text: string) => u("paragraph", {
		data: {
			hName: tag,
			hProperties: { className: "dataview dataview-el" }
		}
	}, clean(text))

	// @ts-ignore
	dv.header = (level: number, text: string) => heading(level, clean(text))

	// @ts-ignore
	dv.span = (text: string) => u("text", {
		data: {
			hName: "span",
			hProperties: { className: "dataview dataview-span" }
		}
	}, clean(text))

	// @ts-ignore
	dv.paragraph = (text: string) => u("paragraph", { data: { hProperties: { className: "dataview dataview-p" } } }, clean(text))

	// dv.view = (path, input) => {}

	// @ts-ignore
	dv.list = (elements: string[]) => u("list", {
		data: {
			hName: "ul",
			hProperties: { className: "dataview dataview-ul" }
		}
	}, elements.map(el => listItem(clean(el))))

	// dv.taskList = (tasks, groupByFile) => {}

	// @ts-ignore
	dv.table = (headers: string[], elements: string[][]) => table("left", [tableRow(headers.map(header => tableCell(clean(header)))), elements.map(row => tableRow(row.map(cell => tableCell(clean(cell)))))])

	// So you can conditionally render depending on context:
	dv.export = true

	return dv
}


interface DataviewOptions {
	dv?: Partial<DataviewAPIExtended>,
	page?: Record<string, LiteralValue>,
}

const remarkDataview = (options: DataviewOptions = {}) => (tree: Root) => {
	if (!options?.dv) return tree

	const dv = addCodeblockProcessors(options?.dv)

	// @ts-ignore
	window.dv = dv;

	// @ts-ignore
	visit(tree, { type: "code", lang: "dataviewjs" }, (node: Code) => {
		const res = window.eval(node.value)

		if (res) {
			node.type = res.type
			node.data = res.data
			// @ts-ignore
			node.children = res?.children

			delete node.value
			delete node.lang
		}

		return node
	})

	return tree
}


export default remarkDataview
