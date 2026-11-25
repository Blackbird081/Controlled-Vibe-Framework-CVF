// Text Encoding Exception: the fixed guidance is shared by the Vietnamese and English user interfaces.
export const PHYSICAL_SAFETY_GUIDANCE = {
    vi: 'Hãy rời vùng nguy hiểm, tránh chạm vào thiết bị hoặc công tắc ở đó, chỉ ngắt điện nếu có thể làm an toàn và không nghi rò gas, rồi gọi người có chuyên môn hoặc dịch vụ khẩn cấp nếu có nguy hiểm ngay.',
    en: 'Move away from the danger, avoid touching equipment or switches in the affected area, cut power only if you can do so safely and there is no suspected gas leak, then call a qualified professional or emergency services if there is immediate danger.',
} as const;

export function normalizeRequestText(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replaceAll('\u0111', 'd')
        .replace(/[\u2018\u2019]/g, "'").replace(/[^\S\r\n]+/g, ' ').trim();
}

const fire = [
    /\b(?:on fire|caught fire|catches fire|there(?:'s| is) (?:a )?fire|flames? (?:are )?(?:coming|rising|spreading|shooting)|fire broke out)\b/,
    /\b(?:boc chay|bat lua|chay (?:bung|lan|lon|rui)|lua (?:dang chay|boc|chay|lan)|co lua|xay ra chay|(?:nha|bep|o dien|tu dien) (?:dang |bi )?chay)\b/,
];
const smoke = [
    /\b(?:there(?:'s| is) smoke|smoke (?:is )?(?:coming|from|pouring|rising|filling)|(?:giving|sending|putting) off smoke|(?:is|are|started) smoking)\b/,
    /\b(?:boc khoi|xi khoi|phun khoi|co khoi|khoi (?:bay|boc|thoat|phun|xong|day|tu))\b/,
];
const burnOdor = [
    /\b(?:(?:burning|burnt|scorched) (?:smell|odor|odour|plastic|wiring)|(?:smells?|odou?r) (?:of|like) [^.!?\n]{0,35}(?:burnt|burning|scorching|melting))\b/,
    /\b(?:mui (?:khet|chay|nhua chay|day dien chay|khoi)|chay khet|khet nhu)\b/,
];
const electricalDeviceEn = /\b(?:electrics|(?:electric(?:al)?|electrics|power|meter|fuse|breaker|mains) (?:cupboards?|closets?|rooms?|cabinets?|box(?:es)?|boards?|panels?)|(?:electric(?:al)?|power) (?:equipment|appliances?)|(?:ceiling lights?|light (?:fittings?|fixtures?|switch(?:es)?)|fused spurs?)|outlets?|(?:plug |wall |power )?sockets?(?: outlets?)?|receptacles?|plugs?|(?:electric(?:al)? |power |extension )?cords?|(?:extension |mains )leads?|wiring|cables?|(?:circuit )?breakers?(?: (?:box|cabinet))?|power strips?|power bars?|multi[- ]?plugs?|(?:main )?(?:service|distribution) panels?|(?:switch|fuse)boards?|consumer units?|appliances?)\b/;
const electricalDeviceVi = /(?:o (?:cam|dien|chia)(?: dien)?|phich(?: cam)?|day (?:dien|nguon|noi(?: dien)?)|(?:mang )?cap dien|(?:tu|buong|phong|hop) (?:dien|cau dao)|bang dien(?: tong)?|cau dao(?: tong)?|aptomat|cuc chia dien|(?:thiet bi|do) dien)/.source;

function nearbySignals(one: string, other: string): RegExp {
    const gap = /[^.!?\n]{0,80}/.source;
    return new RegExp(`\\b${one}\\b${gap}\\b${other}\\b|\\b${other}\\b${gap}\\b${one}\\b`);
}

const electricalSparksEn = /\bspark(?:s|ed|ing|y)?\b/;
const waterNearDeviceEn = /\b(?:leak(?:s|ed|ing|age)?|puddles?|flood(?:s|ed|ing|water)?|drip(?:s|ped|ping)?|wet|soaked|pour(?:s|ed|ing)?|spill(?:s|ed|t|ing)?|seep(?:s|ed|ing)?|(?:water|rain)(?:\s+[a-z]+){0,5}\s+(?:(?:comes?|came|coming|runs?|ran|running) (?:through|into|onto|from)|flow(?:s|ed|ing)?|pooling)|standing water)\b/;
const electricalNoiseOrHeatEn = /\b(?:fizz(?:es|ed|ing)?|crackl(?:e|es|ed|ing)|buzz(?:es|ed|ing)?|hum(?:s|med|ming)?|pop(?:s|ped|ping)?|sizzl(?:e|es|ed|ing)|hiss(?:es|ed|ing)?|(?:burning|scorching|too) hot|(?:is|feels?) hot (?:to (?:the )?touch|when touched))\b/;

function hasElectricalIncident(text: string): boolean {
    return text.split(/[.!?\n]+/).some(sentence => electricalDeviceEn.test(sentence)
        && [electricalSparksEn, waterNearDeviceEn, electricalNoiseOrHeatEn].some(signal => signal.test(sentence)));
}

const sparks = [
    /\b(?:sparking|sparks? (?:at|from|near|coming|shooting)|short[- ]circuit(?:ed|ing)?|shorted(?: out)?|electrical arc(?:ing)?)\b/,
    /\bsparks?\b[^.!?\n]{0,40}\b(?:flew|fly|flying|came|come|coming|jump(?:ed|ing)?|shoot(?:ing)?|shot)\b[^.!?\n]{0,20}\b(?:from|out of|around|near|across)\b/,
    /\b(?:tia lua|to(?:e|et) lua|ban lua|phat lua|danh lua|xet lua|chap dien|dien bi chap|doan mach)\b/,
];
const gas = [
    /\b(?:smell(?:s|ing)? (?:of )?(?:natural gas|gas|propane)|(?:gas|propane) leak(?:ing)?|leak(?:ing)? (?:natural gas|gas|propane)|(?:gas|propane) (?:is )?(?:hissing|escaping)|hissing [^.!?\n]{0,32}(?:gas|propane))\b/,
    /\b(?:(?:ro|ri|mui|thoat|xi) (?:khi )?ga(?:s)?|(?:ga(?:s)?|khi ga(?:s)?) (?:(?:bi|dang|vua) )?(?:ro|ri|thoat|xi))\b/,
];
const shock = [
    /\b(?:electric(?:al)? shock|electrocut(?:ed|ion)|(?:got|was|getting) shocked (?:by|while|when)|electrical (?:leakage|current leaking)|live casing)\b/,
    /\b(?:giat dien|dien giat|ro dien|dien ro|vo (?:may|tu) nhiem dien|cham vao [^.!?\n]{0,30}bi giat)\b/,
];
const waterVerbVi = /(?:ro(?: ri)?|ri|chay|tran|ngap|uot|nho)/.source;
const waterNearPower = [
    nearbySignals(electricalDeviceVi, `(?:ngap|uot|nho (?:tung )?giot|${waterVerbVi} nuoc|nuoc\\b[^.!?\\n]{0,36}\\b${waterVerbVi})`),
    /\bair[- ]conditioner[^.!?\n]{0,80}(?:leaking|dripping) water\b/,
    /\b(?:may lanh|dieu hoa)[^.!?\n]{0,80}(?:ro|ri|chay|nho) nuoc\b/,
];
const electricalNoiseOrHeat = [
    nearbySignals(electricalDeviceVi, /(?:lach tach|xeo xeo|lep bep|let xet|xet xet|xi xi|(?:keu|tieng) (?:re|u|o o)|nong (?:ran|bong tay|rat|bat thuong))/.source),
];
const hazardSignals = [...fire, ...smoke, ...burnOdor, ...sparks, ...gas, ...shock, ...waterNearPower, ...electricalNoiseOrHeat];
const urgentPlumbing = /\b(?:goi (?:giup )?tho sua ong nuoc[^.!?\n]{0,35}ngay|call (?:a|the) plumber[^.!?\n]{0,35}(?:right now|urgently))\b/;

const documentsEn = /^(?:(?:please |help me )?(?:write|draft|create|prepare|make|design|produce|provide) |(?:i|we) (?:need|want) )(?:an? |the )?(?:[a-z-]+ ){0,6}(?:procedure|plan|guide|checklist|report|policy|document|template|training|instructions)\b/;
const documentsVi = /^(?:(?:toi|minh|em|chung toi) )?(?:(?:can|muon|hay|giup toi) )?(?:(?:viet|soan|lap|len|tao|thiet ke|chuan bi|lam) )?(?:(?:mot|ban|mau) )*(?:quy trinh|ke hoach|bao cao|danh sach|tai lieu|huong dan|bai huan luyen|kich ban dien tap|mau)\b/;

export function isDocumentRequest(request: string): boolean {
    return documentsEn.test(request) || documentsVi.test(request);
}

export function hasPhysicalSafetyConcern(request: string, detail = ''): boolean {
    if (isDocumentRequest(request)) return false;
    return urgentPlumbing.test(request) || hasElectricalIncident(request) || hasElectricalIncident(detail)
        || hazardSignals.some(signal => signal.test(request) || signal.test(detail));
}
