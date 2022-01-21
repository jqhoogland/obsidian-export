import { visit } from "unist-util-visit";
import { getUrl, parseUrl } from "../../../utils";
import { Element, Root } from "hast";
import { DataviewAPI } from "obsidian-dataview";

interface FixObsidianLinksOptions {
	dv?: DataviewAPI
}

const rehypeFixObsidianLinks = (options: FixObsidianLinksOptions = {}) => (tree: Root) => {
	const dv = options?.dv

	// @ts-ignore
	visit(tree, { tagName: "a" }, (node: Element) => {
		// @ts-ignore
		const href: string = node?.properties?.href;
		if (href?.[0] === "#" && href?.slice(0, 7) !== "#/page/") return node;

		const [oldUrl, id = ""] = parseUrl(href).split("#");

		if (["http", "mail"].includes(oldUrl.slice(0, 4))) {
			return node
		}

		// @ts-ignore
		const target = dv.page(oldUrl);
		const newUrl = getUrl(target);

		if (!newUrl) {
			node.tagName = "span"
			node.properties.href = ""
		} else {
			node.properties.href = "/" + newUrl + "#" + id
		}

		return node
	})

	return tree
}


export default rehypeFixObsidianLinks
