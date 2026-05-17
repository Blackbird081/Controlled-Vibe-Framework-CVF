import re


class ContrastEngine:

    def hex_to_rgb(self, hex_color: str):
        hex_color = hex_color.lstrip("#")
        if len(hex_color) == 3:
            hex_color = ''.join([c*2 for c in hex_color])
        return tuple(int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))

    def relative_luminance(self, rgb):
        def transform(c):
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
        r, g, b = map(transform, rgb)
        return 0.2126 * r + 0.7152 * g + 0.0722 * b

    def contrast_ratio(self, color1: str, color2: str):
        rgb1 = self.hex_to_rgb(color1)
        rgb2 = self.hex_to_rgb(color2)

        lum1 = self.relative_luminance(rgb1)
        lum2 = self.relative_luminance(rgb2)

        lighter = max(lum1, lum2)
        darker = min(lum1, lum2)

        return (lighter + 0.05) / (darker + 0.05)

    def passes_wcag(self, fg: str, bg: str, font_size: int):
        ratio = self.contrast_ratio(fg, bg)
        if font_size >= 18:
            return ratio >= 3.0
        return ratio >= 4.5