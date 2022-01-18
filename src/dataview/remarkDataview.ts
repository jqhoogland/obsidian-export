import { visit } from "unist-util-visit";
import { Parent } from "mdast";
import { DataviewApi } from "obsidian-dataview/lib/api/plugin-api";
import { root } from "mdast-builder";
import { u } from "unist-builder";

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
            <div class="self-stretch hover:bg-slate-200 flex-6 card mb-2">
              <div class="flex">
                <h4 class="pr-5 mt-1">${icon ?? ""}</h4>
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
		return dv.list([`<div class="grid gap-2 grid-cols-1">${cards.join("")}</div>`])

	}
}

const addCodeblockProcessors = dv => {
	dv.el = (tag, text) => {
		return u(tag, { hName: tag }, text)
	}
	dv.header = (level, text) => {
		return u(`h${1}`, text)
	}
	dv.span = (text) => {
		return u("span", text)
	}
	dv.paragraph = (text) => {
		return u("p", text)
	}
	// dv.view = (path, input) => {}
	dv.list = (elements) => {
		return u("list", elements.map(el => u("listItem", el)))
	}
	// dv.taskList = (tasks, groupByFile) => {}
	dv.table = (headers, elements) => {
		return u("table", [u("tHead", u("tr", headers.map(header => u("td", header)))), elements.map(row => u("tr", row.map(cell => u("td", cell))))])
	}
	return dv
}


/**
 * Based on remark-mermaidjs:
 * https://github.com/remarkjs/remark/blob/main/doc/plugins.md#list-of-plugins
 *
 * @param options
 */
const remarkDataview = (options = {}) => (tree) => {
	const instances: [string, number, Parent][] = [];

	visit(tree, { type: "code", lang: "dataviewjs" }, (node, index, parent) => {
		const { dv: _dv, page } = options
		const customJS = { Cards }
		console.log("BEFORE", node, parent, index)


		// dv.component = document.createElement("div")
		const dv = addCodeblockProcessors(_dv)
		window.dv = dv;
		console.log({ dv, page, customJS })
		const res = window.eval(node.value)

		if (res) {
			node.type = res.type
			node.value = res?.value
			node.children = res?.children
			delete node.lang
		}

		console.log("AFTER", res, node)
	})

	// Nothing to do. No need to start puppeteer in this case.
	if (!instances.length) {
		return tree;
	}


	return tree
}


export default remarkDataview
