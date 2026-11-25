import { isDocumentRequest, normalizeRequestText } from '@/lib/physical-safety';

const englishCommand = /^(?:(?:please|(?:can|could|would) you|help me(?: to)?|i (?:need|want|would like) to) )*(?:(?:ask|tell|text|message|email|notify|reply(?: to)?|respond to) |(?:write|draft|compose|send) (?:me )?(?:(?:a|the|short|quick|brief|friendly|polite|birthday|personal|thank-you) )*(?:text(?: message)?|message|email|note|reply) (?:to|for) )(.+)/i;
const englishRecipient = /^(?:him|her|you|me|(?:my|our|the|your) (?:boss|manager|neighbou?r|sister|brother|father|mother|parent|teacher|colleague|friend|client|doctor|landlord|supervisor)|(?:mr|mrs|ms|mx|dr)\.? [a-z]+)\b/;
const englishName = /^(?:\p{Lu}[\p{L}'\u2019-]+\b|[\p{L}'\u2019-]+ (?:that|if|whether|about|when|why|where|how|to|thanks)\b)/u;
const englishGroup = /^(?:(?:all(?: (?:the|our|my))?|the|my|our|your|a) )?(?:everyone|everybody|anyone|someone|people|them|staff|customers?|parents|clients|subscribers|members|employees|residents|team|group|department|company|list|audience|users|if|whether|how|what|why|about|a|an)\b/;

const vietnameseCommand = /^(?:(?:(?:toi|minh|em|chung toi) )?(?:can|muon|nho) |(?:hay|lam on) )*(?:(?:nhan(?: tin)?|gui tin nhan|gui email|hoi(?: xem)?|bao|tra loi) |(?:viet|soan) (?:(?:mot|giup|ho|toi|minh|em) )*(?:tin(?: nhan)?|loi nhan|email|thu|tin tra loi) )(?:(?:giup|ho|gium)(?: (?:toi|minh|em|anh|chi))? )?(?:(?:cho|voi|den) )?(.+)/;
const vietnameseRecipient = /^(?:anh|chi|co|chu|bac|ong|ba|ban|thay|me|bo|ba noi|ba ngoai|sep|nguoi do|nguoi ay)\b/;
const vietnameseName = /^[a-z]{2,}(?: [a-z]{2,}){0,2} (?:la|rang|biet|xem|ve|co|nhe|toi|de|cho)\b/;
const vietnameseNonPerson = /^(?:tat ca|toan bo|ca (?:nhom|nha|lop)|cac|nhung|mot so|moi nguoi|ho|team|nhom|phong ban|doi ngu|danh sach|khach hang|phu huynh|cu dan|hoi vien|anh em|ba me|ban be|ban quan ly|ban tin|ban mau|ban sao|quy trinh|ke hoach|bao cao|co (?:the|cach|nen|can|duoc|phai))\b/;

export function isPersonalMessageRequest(description: string): boolean {
    const input = description.trim().normalize('NFC').replace(/\s+/g, ' ');
    const normalized = normalizeRequestText(input);
    const english = input.match(englishCommand)?.[1];
    if (english) {
        const recipient = normalizeRequestText(english);
        return !englishGroup.test(recipient) && (englishRecipient.test(recipient) || englishName.test(english));
    }
    const vietnamese = normalized.match(vietnameseCommand)?.[1];
    return Boolean(vietnamese && !vietnameseNonPerson.test(vietnamese)
        && (vietnameseRecipient.test(vietnamese) || vietnameseName.test(vietnamese)
            || /^\p{Lu}\p{L}+/u.test(input.slice(-vietnamese.length))));
}

export function isMessagingProject(description: string): boolean {
    const text = normalizeRequestText(description);
    const usesMessages = /\b(?:messages?|messaging|texting|texts|sms|reminders?|notifications?|tin nhan|nhan tin|gui tin|gui thong bao|nhac hen|nhac viec)\b/.test(text);
    return usesMessages && (isDocumentRequest(text)
        || /\b(?:app(?:lication)?s?|software|system|tool|automatic|document|bulk|mass|campaign|analy[sz]\w*|analytics|phan tich|ung dung|phan mem|he thong|cong cu|tu dong|hang loat|chien dich)\b/.test(text));
}
