class DSLParser:

    def parse(self, dsl_text):

        rules = []
        lines = dsl_text.strip().split("\n")

        current_rule = {}

        for line in lines:
            line = line.strip()

            if line.startswith("RULE"):
                if current_rule:
                    rules.append(current_rule)
                current_rule = {"name": line.split()[1]}

            elif line.startswith("WHEN"):
                current_rule["condition"] = line[5:]

            elif line.startswith("THEN"):
                current_rule["action"] = line.split("=")[1].strip().strip('"')

        if current_rule:
            rules.append(current_rule)

        return rules