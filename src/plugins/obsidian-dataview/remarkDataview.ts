import { visit } from "unist-util-visit";
import { Code, Root } from "mdast";
import { heading, list, listItem, table, tableCell, tableRow } from "mdast-builder";
import { u } from "unist-builder";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import { map } from "unist-util-map";
import { DataviewAPI, LiteralValue } from "obsidian-dataview";
import { DVResult } from "./types";
import { Properties } from "hast";

interface DataviewAPIExtended extends DataviewAPI {
	el: (tag: string, text: string) => Node,
	header: (level: number, text: string) => Node,
	span: (text: string) => Node,
	paragraph: (text: string) => Node,
	list: (elements: string[]) => Node,
	table: (headers: string[], elements: string[][]) => Node

}

/**
 * A class I like to use with CustomJS.
 * I'll remove this once I've integrated CustomJS.
 * For now, I need to keep it in scope for the `window.eval` call below
 */
class Cards {
	getParentName(f: DVResult) {
		return f?.parent?.type === "file"
			? f?.parent?.path
			: f?.parent?.values?.[0]?.values?.[0];
	}

	getIcon(dv: DataviewAPIExtended, f: DVResult) {
		const parentName = this.getParentName(f)

		// @ts-ignore
		const parent = dv.pages()
			.where((_f: DVResult) => _f.file.name === parentName)?.values?.[0];

		return f?.icon ?? parent?.icon;
	}

	render(dv: DataviewAPIExtended, f: DVResult) {
		const icon = this.getIcon(dv, f);

		return `
          <a class="internal-link flex self-stretch hover:no-underline hover:text-slate-700" href="${f?.file?.name}" data-href="${f?.file?.name}" target="_blank" rel="noopener">
            <div class="self-stretch hover:bg-slate-200 flex-6 card mb-2 w-full">
              <div class="flex flex-1 space-x-4">
                <h5 class="mt-1">${icon ?? ""}</h5>
                <h6 class="text-slate-800 font-semibold mt-1">${f.file.name}</h6>
              </div>
             ${f?.description ? `<div class="text-slate-500 hover:text-slate-500">${f?.description}</div>` : ""}
           </div>
         </a>
       `
	}

	dateToInt(str: string) {
		return parseInt(str?.replace("-", ""));
	}

	matchFilters(f: DVResult, filters: Record<string, any>) {
		const parentMatch = !filters?.parent || filters?.parent === this.getParentName(f);
		const tagsMatch = !filters?.tags || f?.tags?.values?.includes(filters?.tags);  // include mongodb-like queries like $in and $all
		return parentMatch && tagsMatch;
	}

	renderList(dv: DataviewAPIExtended, type: string, filters: Record<string, any>, order: "date" | "order" = "date") {
		// @ts-ignore
		const cards = dv.pages()
			.where((f: DVResult) => !!f?.published == !!(filters?.published ?? true) && f?.type === type && this.matchFilters(f, filters))
			.sort((f: DVResult) => order === "date" ? -this.dateToInt(f?.date?.path) : order === "order" ? f?.order : f?.file?.name)
			.map((f: DVResult) => this.render(dv, f));
		return dv.span(cards)

	}
}

const processor = unified().use(rehypeParse, { fragment: true }) // .use(rehypeRemark)

interface CleanedNode extends Node {
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
const addCodeblockProcessors = (dv: DataviewAPIExtended): DataviewAPIExtended => {
	const clean = (value: any) => {
		if (typeof value === "string") {
			const _res = processor.parse(`<span>${value}</span>`)
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

	// @ts-ignore
	dv.el = (tag: string, text: string) => u("paragraph", { hName: tag }, clean(text))

	// @ts-ignore
	dv.header = (level: number, text: string) => heading(level, clean(text))

	// @ts-ignore
	dv.span = (text: string) => u("text", { hName: "span" }, clean(text))

	// @ts-ignore
	dv.paragraph = (text: string) => u("paragraph", clean(text))

	// dv.view = (path, input) => {}

	// @ts-ignore
	dv.list = (elements: string[]) => list("unordered", elements.map(el => listItem(clean(el))))

	// dv.taskList = (tasks, groupByFile) => {}

	// @ts-ignore
	dv.table = (headers: string[], elements: string[][]) => table("left", [tableRow(headers.map(header => tableCell(clean(header)))), elements.map(row => tableRow(row.map(cell => tableCell(clean(cell)))))])

	return dv
}


interface DataviewOptions {
	dv?: DataviewAPI,
	page?: Record<string, LiteralValue>
}

const remarkDataview = (options: DataviewOptions = {}) => (tree: Root) => {
	const { dv: _dv } = options
	if (!_dv) return tree

	const dv = addCodeblockProcessors(_dv)

	// @ts-ignore
	window.dv = dv;

	// @ts-ignore
	visit(tree, { type: "code", lang: "dataviewjs" }, (node: Code) => {
		const res = window.eval(node.value)

		if (res) {
			node.type = res.type

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
