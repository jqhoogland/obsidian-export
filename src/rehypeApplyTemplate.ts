import h from "hastscript";

interface ApplyTemplateOptions {
	styles: (string)[],
	scripts: (string)[]
}

const rehypeApplyTemplate = (options: ApplyTemplateOptions = {}) => (tree) => {
	// Add stylesheets
	const styles = options?.styles ?? [];
	const scripts = options?.scripts ?? [];
	const bodyChildren = [...tree.children];

	tree.children = [
		// Styles
		h("head", styles.map(style => (h("link", { rel: "stylesheet", type: "text/css", href: style })))),

		// Body TODO: Wrap this in a template
		h("body", bodyChildren),

		// Scripts
		h("footer", scripts.map(script => (h("script", { type: "text/javascript", src: script }))))
	]

	console.log({ tree })

	return tree
}

export default rehypeApplyTemplate
