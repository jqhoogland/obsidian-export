import h from "hastscript";
import { unified } from "unified";
import { DEFAULT_EXTRA_STYLES, DEFAULT_SCRIPTS, DEFAULT_STYLES } from "./css";
import rehypeStringify from "rehype-stringify";
import Mustache from "mustache"

interface NavItem {
	label: string,
	href: string
}

interface ApplyTemplateOptions {
	links: NavItem[],
	brand: string,
	title: string,
	styles: (string | {})[],
	scripts: (string | {})[],
	template: string // should be a valid html + mustache template.
}

const getProperties = (style, attr = "href") => {
	if (typeof style === "string") return { [attr]: style };
	return style
}


const DEFAULT_TEMPLATE = `
<html>
{{head}}
<body>
<nav>
<a href="/">{{nav.brand}}</a>
{{#nav.items}}
<a href="{{href}}">{{label}}</a>
{{/nav.items}}
</nav>
{{main}}
</body>
{{footer}}
</html>
`

export default function rehypeApplyTemplate(_options) {
	const processorSettings = /** @type {Options} */ (this.data('settings'))
	const options = Object.assign({}, processorSettings, _options)

	Object.assign(this, { Compiler: compiler })

	/**
	 * @type {import('unified').CompilerFunction<Node, string>}
	 */
	function compiler(tree) {
		const { brand = "", title = "", links = [], template = DEFAULT_TEMPLATE } = options
		const styles = [...(options?.styles ?? []), ...DEFAULT_STYLES];
		const scripts = [...(options?.scripts ?? []), ...DEFAULT_SCRIPTS];

		const head = unified()
			.use(rehypeStringify, { allowDangerousHtml: true, fragment: true })
			.stringify(
				h("head", [...styles.map(style => (h("link", {
					rel: "stylesheet",
					type: "text/css", ...getProperties(style)
				}))), ...DEFAULT_EXTRA_STYLES, h("title", title)]),
			)

		const main = unified()
			.use(rehypeStringify, { allowDangerousHtml: true, fragment: true })
			.stringify(h("main", tree.children))

		const footer = unified()
			.use(rehypeStringify, { allowDangerousHtml: true, fragment: true })
			.stringify(h("footer", scripts.map(script => (h("script", { ...getProperties(script, "src") })))))

		Mustache.escape = function (text) {
			return text;
		};

		// TODO: Add support for Table of Contents, References, and Footnotes.
		return String(Mustache.render(template, {
			nav: {
				items: links.map(slug => ({ label: _.capitalize(slug.replace("/", "")), href: `/${slug}` })),
				brand
			}, head, main, footer
		}))

	}
}
