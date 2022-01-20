import { visit } from "unist-util-visit";
import { Code, Root } from "mdast";
import { DataviewApi } from "obsidian-dataview/lib/api/plugin-api";
import { heading, list, listItem, table, tableCell, tableRow } from "mdast-builder";
import { u } from "unist-builder";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import { map } from "unist-util-map";
import { LiteralValue } from "obsidian-dataview";

class Cards {
	getParentName(f) {
		return f?.parent?.type === "file"
			? f?.parent?.path
			: f?.parent?.values?.[0]?.values?.[0];
	}

	getIcon(dv, f) {
		const parentName = this.getParentName(f)

		const parent = dv.pages()
			.where(_f => _f.file.name === parentName)?.values?.[0];

		return f?.icon ?? parent?.icon;
	}

	render(dv, f) {
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

	dateToInt(str) {
		return parseInt(str?.replace("-", ""));
	}

	matchFilters(f, filters) {
		console.log(f?.tags)
		const parentMatch = !filters?.parent || filters?.parent === this.getParentName(f);
		const tagsMatch = !filters?.tags || f?.tags?.values?.includes(filters?.tags);  // include mongodb-like queries like $in and $all
		return parentMatch && tagsMatch;
	}

	renderList(dv: DataviewApi, type, filters, order = "date") {
		const cards = dv.pages()
			.where((f) => !!f?.published == !!(filters?.published ?? true) && f?.type === type && this.matchFilters(f, filters))
			.sort(f => order === "date" ? -this.dateToInt(f?.date?.path) : order === "order" ? f?.order : f?.file?.name)
			.map(f => this.render(dv, f));
		return dv.span(cards)

	}
}

const processor = unified().use(rehypeParse, { fragment: true }) // .use(rehypeRemark)

/**
 * Mock dv's rendering functions.
 * Instead of writing elements to the document, render as html strings.
 *
 * @param dv
 */
const addCodeblockProcessors = dv => {
	const clean = value => {
		if (typeof value === "string") {
			const _res = processor.parse(`<span>${value}</span>`)
			const res = map(_res, (node) => {
				return Object.assign({}, node, {
					data: {
						...node?.data,
						hName: node.tagName,
						hProperties: node.properties
					}
				})
			})
			return res.children ?? u("text", value)
		}
		return value
	}

	dv.el = (tag, text) => {
		return u("paragraph", { hName: tag }, clean(text))
	}
	dv.header = (level, text) => {
		return heading(level, clean(text))
	}
	dv.span = (text) => {
		return u("text", { hName: "span" }, clean(text))
	}
	dv.paragraph = (text) => {
		return u("paragraph", clean(text))
	}
	// dv.view = (path, input) => {}
	dv.list = (elements) => {
		return list("unordered", elements.map(el => listItem(clean(el))))
	}
	// dv.taskList = (tasks, groupByFile) => {}
	dv.table = (headers, elements) => {
		return table("left", [tableRow(headers.map(header => tableCell(clean(header)))), elements.map(row => tableRow(row.map(cell => tableCell(clean(cell)))))])
	}
	return dv
}


interface DataviewOptions {
	dv?: DataviewApi,
	page?: Record<string, LiteralValue>
}

const remarkDataview = (options: DataviewOptions = {}) => (tree: Root) => {
	const { dv: _dv, page } = options
	if (!_dv) return tree

	const dv = addCodeblockProcessors(_dv)
	window.dv = dv;

	visit(tree, { type: "code", lang: "dataviewjs" }, (node: Code) => {
		const res = window.eval(node.value)

		if (res) {
			node.type = res.type
			node.children = res?.children
			delete node.value
			delete node.lang
		}

		return node
	})

	return tree
}


export default remarkDataview
