import tinycss2
from cssselect2 import Matcher, ElementWrapper
from bs4 import BeautifulSoup


class CSSEngine:

    def __init__(self):
        self.rules = []

    def load_css(self, css_content: str):
        stylesheet = tinycss2.parse_stylesheet(css_content, skip_comments=True)

        for rule in stylesheet:
            if rule.type == "qualified-rule":
                selector = tinycss2.serialize(rule.prelude).strip()
                declarations = tinycss2.parse_declaration_list(rule.content)

                props = {}
                for decl in declarations:
                    if decl.type == "declaration" and not decl.name.startswith("--"):
                        value = tinycss2.serialize(decl.value).strip()
                        props[decl.name] = value

                self.rules.append({
                    "selector": selector,
                    "properties": props
                })

    def match(self, html_content: str):
        soup = BeautifulSoup(html_content, "html.parser")
        matcher = Matcher()

        for rule in self.rules:
            try:
                matcher.add_selector(rule["selector"], rule["properties"])
            except Exception:
                continue

        computed_styles = []

        for el in soup.find_all(True):
            wrapped = ElementWrapper.from_html_root(el)
            for selector, props in matcher.match(wrapped):
                computed_styles.append({
                    "element": el.name,
                    "properties": props
                })

        return computed_styles