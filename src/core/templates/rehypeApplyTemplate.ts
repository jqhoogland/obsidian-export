import h from "hastscript";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import { visit } from "unist-util-visit";
import { DEFAULT_EXTRA_STYLES, DEFAULT_SCRIPTS, DEFAULT_STYLES } from "./css";
import _ = require("lodash");

interface NavItem {
	label: string,
	href: string
}

interface ApplyTemplateOptions {
	styles: (string)[],
	scripts: (string)[],
	template: (templateOptions: { brand: string, items: NavItem[] }) => string // should be valid html (to be converted to hast)
}

// Using tailwindcss
// TODO: Support for jinja-style templates
const DEFAULT_TEMPLATE = ({ brand, items }) => `
<nav class="
relative
w-full
flex flex-wrap
items-center
justify-between
py-4
bg-gray-100
text-gray-500
hover:text-gray-700
focus:text-gray-700
shadow-lg
navbar navbar-expand-lg navbar-light
">
<div class="container-fluid w-full flex flex-wrap items-center justify-between px-6">
<button class="
    navbar-toggler
    text-gray-500
    border-0
    hover:shadow-none hover:no-underline
    py-2
    px-2.5
    bg-transparent
    focus:outline-none focus:ring-0 focus:shadow-none focus:no-underline
  " type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="bars"
  class="w-6" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
  <path fill="currentColor"
    d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z">
  </path>
</svg>
</button>
<div class="collapse navbar-collapse flex-grow items-center" id="navbarSupportedContent">
<a class="text-xl text-black" href="/">${brand}</a>
<!-- Left links -->
<ul class="navbar-nav flex flex-col pl-0 list-style-none mr-auto">
 ${items.map(({ label, href }) => `<li class="nav-item px-2">
    <a class="nav-link" aria-current="page" href="${href}">${label}</a>
  </li>`).join("")}
</ul>
<!-- Left links -->
</div>
<!-- Collapsible wrapper -->
</div>
  </nav>
  <div class="container mx-auto py-5 px-4 max-w-md">
  <div class="bg-red-700 shadow-lg rounded-lg w-full p-3 text-white">
    <h5>Site Under Construction 🚧</h5>
    <p>Some links might be broken and some of the formatting off, but I promise: it will be worth the pain.</p>
  </div>
  <main class="content"></main>
  </div>
`

const getProperties = (style, attr = "href") => {
	if (typeof style === "string") return { [attr]: style };
	return style
}


const rehypeApplyTemplate = (options: ApplyTemplateOptions = {}) => (tree) => {
	const { brand = "", title = "", links = [] } = options

	// Add stylesheets
	const styles = [...(options?.styles ?? []), ...DEFAULT_STYLES];
	const scripts = [...(options?.scripts ?? []), ...DEFAULT_SCRIPTS];
	const templateStr = (options?.template ?? DEFAULT_TEMPLATE)({
		brand,
		items: links.map(link => ({ label: _.capitalize(link), href: `/${link}` }))
	});
	const bodyChildren = [...tree.children];

	const template = unified().use(rehypeParse, { fragment: true }).parse(templateStr)
	visit(template, { tagName: "main" }, node => {
		node.children = bodyChildren
	})

	tree.children = [
		// Styles
		h("head", [...styles.map(style => (h("link", {
			rel: "stylesheet",
			type: "text/css", ...getProperties(style)
		}))), ...DEFAULT_EXTRA_STYLES, h("title", title)]),

		// Body TODO: Wrap this in a template
		h("body", template.children),

		// Scripts
		h("footer", scripts.map(script => (h("script", { ...getProperties(script, "src") }))))
	]

	return tree
}

export default rehypeApplyTemplate
