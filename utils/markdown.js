import MarkdownIt from "markdown-it";
const md = new MarkdownIt();
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const aIndex = tokens[idx].attrIndex("target");

  if (aIndex < 0) {
    tokens[idx].attrPush(["target", "_blank"]);
  } else {
    tokens[idx].attrs[aIndex][1] = "_blank";
  }

  return self.renderToken(tokens, idx, options);
};
const generateMarkdown = (content) => {
  return md.render(content);
};
const generateMarkdownInline = (content) => {
  return md.renderInline(content);
};

export default md;
export { generateMarkdown, generateMarkdownInline };