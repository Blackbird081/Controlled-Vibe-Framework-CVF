"""Vietnamese + English stopwords for search filtering."""

STOPWORDS_VI = {
    "và", "cho", "của", "các", "với", "được", "để", "trong", "theo",
    "khi", "không", "là", "có", "này", "từ", "một", "những", "hoặc",
    "nếu", "đã", "sẽ", "tới", "bao", "gồm", "nào", "về", "như",
    "cần", "thể", "đó", "qua", "tại", "giữa", "sau", "trước",
    "bằng", "đến", "lại", "ra", "lên", "vào", "mà", "còn", "vì",
    "nên", "hay", "rồi", "rất", "hơn", "nhất", "ở", "trên", "dưới",
    "phải", "chỉ", "đều", "đi", "thì", "ai", "gì", "sao",
}

STOPWORDS_EN = {
    "the", "a", "an", "and", "or", "for", "to", "of", "in", "on",
    "at", "by", "with", "from", "as", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "shall", "should", "may", "might", "can", "could",
    "not", "no", "but", "if", "then", "than", "that", "this", "these",
    "those", "it", "its", "my", "your", "our", "their", "his", "her",
    "we", "you", "they", "he", "she", "all", "each", "every", "both",
    "few", "more", "most", "other", "some", "such", "only", "own",
    "so", "up", "out", "into", "over", "after", "before", "between",
    "under", "again", "further", "also", "how", "when", "where", "why",
    "what", "which", "who", "whom", "very", "too", "just", "about",
}

STOPWORDS = STOPWORDS_VI | STOPWORDS_EN
