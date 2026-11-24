// Text Encoding Exception: the patterns distinguish English and Vietnamese user requests.
import { findHomeSpecDeliverable } from './home-spec-deliverable';

const actionEn = /^(?:(?:please|can you|could you|would you)\s+)*(?:order\s+(?:me|us)\b|order\s+.+\s+from\b|place\s+an\s+order\b|call\s+(?:(?:a|the|my)\s+)?(?:plumber|technician|electrician)\b|(?:book|reserve|schedule)\s+(?:(?:me|us|a|an|the|my)\s+)*(?:flight|ticket|table|room|appointment|meeting|reservation)\b)/iu;
const actionVi = /^(?:(?:vui lòng|làm ơn|nhờ|tôi muốn|mình cần)\s+)*(?:đặt\s+(?:giúp|hộ|hàng|món|đồ ăn|vé|lịch|chỗ|phòng|bàn)|gọi\s+(?:thợ|đồ ăn|món))(?=$|[^\p{L}\p{M}])/iu;

const hazardSignals = [
    /\b(?:smell(?:s|ing)? gas|gas leak(?:ing)?|on fire|(?:there's|there is) (?:a fire|smoke)|smoke (?:coming|from))\b/iu,
    /\b(?:(?:electricity|outlet|wiring) near water|water near (?:an? )?(?:outlet|electricity|wiring)|air conditioner.{0,80}(?:leaking|dripping) water)\b/iu,
    /(?<![\p{L}\p{M}])(?:rò|rỉ|mùi)\s+(?:khí\s+)?ga(?:s)?(?![\p{L}\p{M}])|bốc cháy|bốc khói|có khói/iu,
    /(?:máy lạnh|điều hoà|điều hòa).{0,80}(?:rò|rỉ|chảy)\s+nước|(?:điện|ổ cắm)\s+(?:ở )?gần\s+nước|nước\s+(?:ở )?gần\s+(?:điện|ổ cắm)/iu,
];
const urgentPlumbing = /gọi\s+thợ\s+sửa\s+ống\s+nước.{0,35}\bngay\b|\bcall\s+(?:a|the)\s+plumber.{0,35}\b(?:right now|urgently)\b/iu;

export function homeSpecExternalRequest(goal: string, detail: string): 'action' | 'hazard' | null {
    const description = goal.trim().normalize('NFC');
    const context = [description, detail.normalize('NFC')].join('\n');
    const external = actionEn.test(description) || actionVi.test(description);
    const hazard = hazardSignals.some(signal => signal.test(context));
    if (external) return hazard || urgentPlumbing.test(description) ? 'hazard' : 'action';
    if (hazard && !findHomeSpecDeliverable([description])) return 'hazard';
    return null;
}
