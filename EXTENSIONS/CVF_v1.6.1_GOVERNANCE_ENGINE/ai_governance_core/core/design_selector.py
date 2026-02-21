from core.utils import load_json


class DesignSelector:

    def __init__(self, db_path="design_db"):
        self.styles = load_json(f"{db_path}/styles.json")
        self.palettes = load_json(f"{db_path}/palettes.json")
        self.typography = load_json(f"{db_path}/typography.json")

    def select(self, domain: str):
        style = next((s for s in self.styles if domain in s["tags"]), self.styles[0])
        palette = self.palettes[0]
        typo = self.typography[0]

        return {
            "style": style,
            "palette": palette,
            "typography": typo
        }