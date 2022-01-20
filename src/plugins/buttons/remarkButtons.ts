import { visit } from "unist-util-visit";
import * as fs from "fs";
import { u } from "unist-builder";

interface Button {
	name: string,
	action: string, // URL
	id: string // "button-<custom-bit>"
}

const remarkButtons = (options) => (tree) => {
	const plugin = options?.plugin;
	const definitions = options?.definitions;  // Unlike the original plugin, you need to specify *where* the definitions are kept.
	console.log({ plugin })

	if (!plugin) return tree

	// First, process the button definitions.
	// This can only handle link definitions
	/**
	 * Matches:
	 *
	 * ```button
	 * name <some-name>
	 * type link
	 * action <some-link>
	 * ```
	 * ^button-<some-id>
	 *
	 */
	const buttonMatch = /```button\nname (.*)\ntype link\naction (.*)\n```\n\^button\-([\d\w]*)/g
	const buttonsDefinitionsFile = String(fs.readFileSync(options?.definitions))
	const buttons: Button[] = [...buttonsDefinitionsFile.matchAll(buttonMatch)]
		.map(([_, name, action, id]) => ({
			name,
			action,
			id: `button-${id}`
		}))


	// Fill in the button definitions
	visit(tree, { type: "inlineCode", }, (node) => {
			if (node?.value?.slice(0, 7) === "button-") {
				// Find the matching button (or safely fall back to keeping the code block)
				const button = buttons.find(_button => _button.id === node?.value)
				if (!button) return node

				// Update the node with button information

				// Mdast
				node.type = "link"
				node.url = button.action
				node.children = [u("text", { data: { hName: "button", hProperties: { type: "submit" } } }, button.name,)]
				delete node.value

				// Hast
				node.data = node.data ?? {}
				node.data.hName = "form"
				node.data.hProperties = { action: button.action }
				//node.data.hChildren = [h("button", { type: "submit" }, button?.name)]

				console.log({ node })
			}

			return node
		}
	)
	return tree
}

export default remarkButtons
