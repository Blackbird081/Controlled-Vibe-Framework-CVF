class SystemBuilder:

    def build(self, selection: dict):
        return {
            "colors": selection["palette"],
            "typography": selection["typography"],
            "radius": selection["style"]["radius"],
            "shadow": selection["style"]["shadow"],
            "spacing": selection["style"]["spacing"]
        }