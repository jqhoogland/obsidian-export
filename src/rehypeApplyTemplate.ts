import h from "hastscript";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import { visit } from "unist-util-visit";

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
  <main class="content"></main>
  </div>
`

const getProperties = (style, attr = "href") => {
	if (typeof style === "string") return { [attr]: style };
	return style
}

const DEFAULT_EXTRA_STYLES = [h("style", `
p {
  margin-bottom: 0.5rem /* Add a bottom gutter */ 
}
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
}

h1 { font-size: 3rem; margin-top: 1rem }
h2 { font-size: 2.5rem; margin-top: .75rem }
h3 { font-size: 2.125rem; margin-top: .675rem }
h4 { font-size: 1.875rem; margin-top: .5rem }
h5 { font-size: 1.5rem; margin-top: .375rem }
h6 { font-size: 1.25rem; margin-top: .5rem }
`)]

const DEFAULT_STYLES = [
	{
		href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css",
		integrity: "sha512-Fo3rlrZj/k7ujTnHg4CGR2D7kSs0v4LLanw2qksYuRlEzO+tcaEPQogQ0KaoGN26/zrn20ImR1DfuLWnOo7aBA==",
		crossorigin: "anonymous",
		referrerpolicy: "no-referrer"
	},
	{ href: "https://cdn.jsdelivr.net/npm/tw-elements/dist/css/index.min.css" }
]
const DEFAULT_SCRIPTS = [
	"https://cdn.jsdelivr.net/npm/tw-elements/dist/js/index.min.js"
]


const rehypeApplyTemplate = (options: ApplyTemplateOptions = {}) => (tree) => {
	// Add stylesheets
	const styles = [...(options?.styles ?? []), ...DEFAULT_STYLES];
	const scripts = [...(options?.scripts ?? []), ...DEFAULT_SCRIPTS];
	const templateStr = (options?.template ?? DEFAULT_TEMPLATE)({
		brand: "Jesse Hoogland",
		items: [{ label: "Articles", href: "/articles" }, { label: "Series", href: "/series" }]
	});
	const bodyChildren = [...tree.children];

	const template = unified().use(rehypeParse, { fragment: true }).parse(templateStr)
	console.log({ template })
	visit(template, { tagName: "main" }, node => {
		node.children = bodyChildren
	})

	tree.children = [
		// Styles
		h("head", [...styles.map(style => (h("link", {
			rel: "stylesheet",
			type: "text/css", ...getProperties(style)
		}))), ...DEFAULT_EXTRA_STYLES]),

		// Body TODO: Wrap this in a template
		h("body", template.children),

		// Scripts
		h("footer", scripts.map(script => (h("script", { ...getProperties(script, "src") }))))
	]

	console.log({ tree })

	return tree
}

export default rehypeApplyTemplate
