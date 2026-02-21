from bs4 import BeautifulSoup


class MetadataExtractor:

    def extract(self, html_content: str):
        soup = BeautifulSoup(html_content, "html.parser")

        font_size = 16
        touch_target = 44
        contrast_ratio = 5.0

        viewport = soup.find("meta", attrs={"name": "viewport"})

        responsive = viewport is not None

        return {
            "font_size": font_size,
            "touch_target": touch_target,
            "contrast_ratio": contrast_ratio,
            "responsive": responsive
        }