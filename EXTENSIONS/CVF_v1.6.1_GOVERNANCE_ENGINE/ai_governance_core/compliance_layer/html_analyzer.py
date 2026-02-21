import re
from bs4 import BeautifulSoup
from .css_engine import CSSEngine


class HTMLAnalyzer:

    def __init__(self, contrast_engine):
        self.contrast_engine = contrast_engine

    def analyze(self, html_content: str, css_contents=None):

        soup = BeautifulSoup(html_content, "html.parser")
        issues = []

        # ---- BASIC CHECKS ----

        # Missing alt
        for img in soup.find_all("img"):
            if not img.get("alt"):
                issues.append("A11Y-MISSING-ALT")

            # Performance check
            src = img.get("src", "")
            if not src.endswith((".webp", ".avif")):
                issues.append("PERF-IMAGE-FORMAT")

        # Responsive meta
        if not soup.find("meta", attrs={"name": "viewport"}):
            issues.append("LAY-NO-RESPONSIVE")

        # ---- CSS ANALYSIS ----

        if css_contents:
            css_engine = CSSEngine()

            for css in css_contents:
                css_engine.load_css(css)

            computed = css_engine.match(html_content)

            for item in computed:
                props = item["properties"]

                fg = props.get("color")
                bg = props.get("background-color")
                font_size = props.get("font-size")

                if fg and bg:
                    size = int(re.findall(r"\d+", font_size)[0]) if font_size else 16

                    if not self.contrast_engine.passes_wcag(fg, bg, size):
                        issues.append("A11Y-CONTRAST-FAIL")

                if font_size:
                    size = int(re.findall(r"\d+", font_size)[0])
                    if size < 16:
                        issues.append("A11Y-FONT-TOO-SMALL")

        return list(set(issues))