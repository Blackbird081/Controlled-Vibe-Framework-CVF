class TokenEngine:

    def tokenize(self, design_system: dict):
        tokens = {}

        colors = design_system.get("colors", {})
        for key, value in colors.items():
            tokens[f"color.{key}"] = value

        typography = design_system.get("typography", {})
        for key, value in typography.items():
            tokens[f"font.{key}"] = value

        tokens["radius"] = design_system.get("radius")
        tokens["shadow"] = design_system.get("shadow")
        tokens["spacing"] = design_system.get("spacing")

        return tokens