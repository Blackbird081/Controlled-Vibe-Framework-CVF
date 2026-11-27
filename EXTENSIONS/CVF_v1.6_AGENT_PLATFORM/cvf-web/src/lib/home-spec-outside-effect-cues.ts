// Text Encoding Exception: Vietnamese cues are matched against user input, in accented and accent-stripped form.
/**
 * Cues that a Home request may reach outside the project folder or touch sensitive data.
 *
 * This list is separate from `risk-check.ts` on purpose: the Home specification keeps R1 as the
 * displayed risk level for a generic request, and the "first local preview" permission is withheld
 * when one of these cues matches. This is a best-effort net, NOT the control: an independent review
 * found it misses most unseen hazardous phrasings. The control is the hard limits written into the
 * granted permission (local only, sample data, no network, sending, publishing, accounts, money,
 * devices or real personal data; excluded parts are not built). Do not extend this list probe by
 * probe; a false block only costs the ordinary intake route. Bare
 * ambiguous stems ("text", "live", "key", "post", "bank", "share", "host", "thu", "khoa", "dang")
 * are therefore matched only inside hazard phrases. It is not a risk classifier.
 */

// English cues, matched on word boundaries. Every word of an entry accepts regular verb and plural
// endings (see `inflect`), so "delete" also matches "deleting" and "deleted".
const ENGLISH_WORDS = [
    // sending and messaging
    'send', 'sent', 'message', 'sms', 'zalo', 'email', 'e-mail', 'mail', 'notification', 'notify', 'messenger', 'slack',
    'telegram', 'whatsapp', 'discord', 'text message', 'texting', 'text my', 'text them', 'text all', 'text customers',
    'text parents', 'text clients', 'call the', 'call my', 'call them', 'call all', 'phone call',
    // publishing, sharing, hosting
    'publish', 'publicly', 'make public', 'make it public', 'post to', 'post on', 'post it', 'post this', 'post my',
    'post online', 'upload', 'share with', 'share my', 'share it', 'share this', 'share link', 'sharing', 'deploy',
    'hosting', 'host it', 'host this', 'host my', 'host on', 'host online', 'host the site', 'host the page',
    'host the website', 'push to', 'on the web', 'to the web', 'online', 'internet', 'cloud', 'webhook', 'server',
    'github', 'gitlab', 'vercel', 'netlify', 'tiktok', 'youtube', 'instagram', 'twitter', 'tweet', 'facebook',
    // secrets and credentials
    'api', 'private key', 'secret key', 'access key', 'license key', 'password', 'passcode', 'token', 'secret',
    'credential', 'login', 'wifi', 'wi-fi', 'pin code', 'pin number', 'openai',
    // money
    'payment', 'pay', 'bank account', 'bank transfer', 'bank card', 'bank details', 'banking', 'my bank', 'transfer',
    'wire', 'credit card', 'debit card', 'card number', 'automatically buy', 'automatically purchase',
    'automatically order', 'auto buy', 'auto-buy', 'place orders', 'place an order', 'run ads', 'advertise',
    // personal and sensitive data
    'phone number', 'customer', 'client', 'passport', 'social security', 'ssn', 'medical record', 'patient',
    // existing files and machines
    'delete', 'remove', 'erase', 'overwrite', 'rename', 'clean up my', 'tidy my', 'tidy up my', 'get rid of',
    'my file', 'my files', 'my folder', 'my downloads', 'downloads folder', 'pictures folder', 'documents folder',
    'edit my', 'install',
    // existing live systems, scraping, outside services
    'existing', 'live site', 'live website', 'live system', 'live server', 'live database', 'live data', 'go live',
    'going live', 'live stream', 'livestream', 'running site', 'running system', 'running server', 'production',
    'my site', 'my website', 'my store', 'shop website', 'shop site', 'company website', 'company site',
    'my homepage', 'database', 'google', 'scrape', 'crawl', 'connect to', 'connect with', 'sync', 'download', 'fetch',
    'shopee', 'lazada', 'shopify', 'amazon', 'ebay', 'etsy',
    // booking
    'flight', 'booking', 'book tickets', 'book flights', 'book hotels', 'book rooms', 'book appointments',
];

const CONTACT_PEOPLE = ['khach', 'phu huynh', 'nguoi', 'hoc sinh', 'nhan vien', 'benh nhan', 'thanh vien', 'toi', 'minh'];
// "so dien thoai" alone is a shop-intro phrase; a personal phone number names whose number it is.
const PERSONAL_PHONE_PHRASES = CONTACT_PEOPLE.flatMap(person => [
    `so dien thoai ${person}`, `so dien thoai cua ${person}`, `sdt ${person}`, `sdt cua ${person}`,
]).concat(['ten va so dien thoai', 'luu so dien thoai', 'ghi so dien thoai', 'nhap so dien thoai', 'danh sach so dien thoai',
    'quan ly so dien thoai']);

// Vietnamese cues in accent-stripped form (so "xóa" and "xoá" both become "xoa"). Because this list is
// also tested against the stripped form of accented input, a phrase here must be unambiguous even
// without its accents. Collisions ("tự đặt" / "từ đất", "đang dùng" / "đáng dùng") belong in ACCENTED_CUES.
const STRIPPED_PHRASES = [
    // sending, messaging, calls
    'gui', 'tin nhan', 'nhan tin', 'zalo', 'sms', 'email', 'thu dien tu', 'hop thu', 'thong bao cho', 'thong bao qua',
    'thong bao tu dong', 'tu dong thong bao', 'thong bao den', 'thong bao toi', 'goi dien', 'tu dong nhan',
    'nhan cho phu huynh', 'nhan cho khach', 'nhan cho nguoi', 'nhan cho hoc sinh', 'nhan cho nhan vien',
    // publishing, sharing, hosting
    'len mang', 'tren mang', 'chia se', 'may chu', 'tai len', 'xuat ban', 'dua len web', 'dua len mang', 'dua trang len',
    'dua web len', 'day code', 'day len web', 'day len github', 'cong khai', 'cho moi nguoi vao xem', 'dang bai len',
    'dang len web', 'dang len mang', 'dang video', 'dang tin len', 'dang ban len', 'tu dong dang', 'dang nhap vao trang',
    'dang nhap vao tai khoan', 'dang nhap vao he thong', 'dang nhap vao web', 'dang nhap vao website',
    // secrets
    'mat khau', 'mat ma', 'ma khoa', 'khoa api', 'khoa bi mat', 'khoa bao mat', 'khoa rieng', 'ma pin', 'ma bao mat',
    'ma otp', 'otp', 'ma ket', 'ket sat', 'pass wifi',
    // money
    'thanh toan', 'chuyen tien', 'chuyen khoan', 'nap tien', 'rut tien', 'ngan hang', 'hoc phi', 'so tai khoan',
    'the tin dung', 'the ngan hang', 'tu dong tra luong', 'chuyen luong', 'tra luong qua', 'vi momo', 'qua momo',
    'zalopay', 'vnpay', 'chay quang cao', 'chay ads', 'tu dong mua', 'mua tu dong',
    // personal and sensitive data
    'khach hang', 'cmnd', 'cccd', 'can cuoc', 'ho chieu', 'dia chi nha rieng', 'dia chi nha cua', 'dia chi nha toi',
    'dia chi nha minh', 'dia chi that', 'dia chi ca nhan', 'dia chi khach', 'dia chi cua khach', 'dia chi hoc sinh',
    'dia chi cua hoc sinh', 'dia chi nhan vien', 'dia chi cua nhan vien', 'dia chi phu huynh', 'dia chi cua phu huynh',
    'ngay sinh that', 'ngay sinh cua', 'thong tin ca nhan', 'thong tin khach', 'thong tin hoc sinh',
    'thong tin nhan vien', 'thong tin phu huynh', 'thong tin benh nhan', 'benh nhan', 'benh an', 'ho so y te',
    'ho so suc khoe', 'du lieu ca nhan', ...PERSONAL_PHONE_PHRASES,
    // existing files and machines
    'xoa', 'thu muc', 'bo file', 'bo cac file', 'bo het file', 'bo tep', 'bo cac tep', 'file trung', 'tep trung', 'don o d',
    'don o c', 'ghi de', 'sua file', 'sua tep', 'sua tap tin', 'file cua toi', 'tep cua toi', 'tap tin cua toi',
    'doi ten file', 'doi ten anh', 'doi ten toan bo', 'doi ten tat ca', 'doi ten hang loat', 'cai phan mem',
    'cai ung dung', 'cai vao may', 'tat ca may', 'nhieu may',
    // existing live systems, scraping, outside services
    'hien co', 'ket noi', 'dong bo', 'cao du lieu', 'cao gia', 'cao web', 'cao trang', 'lay gia', 'lay du lieu',
    'lay tu trang', 'lay tu web', 'lay don hang', 'tai ve', 'tai xuong', 'tai du lieu', 'shopee', 'lazada', 'tiktok', 'tiki',
    'trang web cua cong ty', 'trang chu cua cong ty', 'trang chu cong ty', 'website cong ty', 'website cua cong ty',
    'trang ban hang cua', 'trang ban hang dang', 'viet lai trang chu', 'sua trang chu', 'sua trang web', 'sua website',
    'thay doi gia tren', 'doi gia tren', 'cap nhat gia tren', 'thay gia tren', 'may cham cong', 'phan mem ke toan',
    'phan mem cua cong ty', 'phan mem cong ty', 'bo sung tinh nang', 'them tinh nang vao', 'cap nhat phan mem',
    'dang dung phan mem', 'dang dung he thong', 'dang dung app', 'dang dung ung dung', 'dang dung website',
    'dang dung trang web', 'dang dung excel', 'dang su dung phan mem', 'dang su dung he thong',
    'dang su dung ung dung', 'dang su dung website', 'dang su dung trang web', 'dang xai phan mem',
    'dang xai he thong', 'dang xai app',
    // booking
    'dat ve', 'dat phong', 'dat lich tu dong', 'tu dong dat',
];

// Cues kept with their accents because the accent-stripped form collides with a very common word
// ("nhắn"/"nhận", "đăng ký"/"đang", "thư"/"thu", "khóa học"/"khoa", "đang chạy bộ"/"đăng", "tự mua"/"từ mùa").
// Checked on NFC-normalized, lower-cased text. "khóa" and "khoá" are both tone-mark spellings.
const ACCENTED_CUES = [
    'nhắn', 'cào', 'thư mời', 'đăng bài', 'đăng lên', 'đăng tin', 'đăng bán', 'đăng nhập', 'đăng video', 'đăng ảnh',
    'đăng hình', 'đẩy lên', 'đẩy code', 'cài lên', 'đang chạy', 'mã khóa', 'mã khoá', 'khóa api', 'khoá api',
    'khóa bí mật', 'khoá bí mật', 'khóa bảo mật', 'khoá bảo mật', 'khóa riêng', 'khoá riêng', 'tự đặt', 'tự mua',
    'gọi cho', 'gọi điện',
];

const stripAccents = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd');
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll(' ', '\\s+');

/** Regular English endings for one word; keeps e-dropping ("delet|ing"), "y" and doubled-consonant forms. */
function inflect(word: string): string {
    if (!/^[a-z]{3,}$/.test(word)) return `${escape(word)}(?:s)?`;
    const stem = word.slice(0, -1);
    const last = word.slice(-1);
    if (last === 'e') return `${stem}(?:es?|ed|ing|d)?`;
    if (last === 'y' && !/[aeiou]/.test(word.slice(-2, -1))) return `${stem}(?:y|ies|ied|ying)`;
    const doubled = /[bdfglmnprt]/.test(last) ? `|${last}(?:ed|ing)` : '';
    return `${word}(?:s|es|ed|ing${doubled})?`;
}
const englishEntry = (phrase: string) => phrase.split(' ').map(inflect).join('\\s+');

const edge = (source: string) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${source})(?![\\p{L}\\p{N}])`, 'u');
const englishCues = edge(ENGLISH_WORDS.map(englishEntry).join('|'));
const strippedCues = edge(STRIPPED_PHRASES.map(escape).join('|'));
const accentedCues = edge(ACCENTED_CUES.map(escape).join('|'));

export const HOME_OUTSIDE_EFFECT_CUES = { english: ENGLISH_WORDS, strippedVietnamese: STRIPPED_PHRASES, accentedVietnamese: ACCENTED_CUES } as const;

/** True when the text mentions sending, publishing, secrets, payment, personal data, deletion or an existing live system. */
export function hasOutsideEffectCue(...texts: readonly string[]): boolean {
    return texts.some(raw => {
        const folded = raw.normalize('NFC').toLowerCase();
        const stripped = stripAccents(folded);
        return accentedCues.test(folded) || englishCues.test(stripped) || strippedCues.test(stripped);
    });
}
