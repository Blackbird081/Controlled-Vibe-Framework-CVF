import { hasPhysicalSafetyConcern, isDocumentRequest, normalizeRequestText } from '@/lib/physical-safety';
import { findHomeSpecDeliverable } from './home-spec-deliverable';

const bookingVerbsEn = /(?:book|reserve|schedule|reschedule|cancel)/.source;
const bookingObjectsEn = /(?:flights?|tickets?|tables?|rooms?|appointments?|meetings?|reservations?|taxis?|cabs?|couriers?|delivery|deliveries)/.source;
const callObjectsEn = /(?:plumber|technician|electrician|repair service|taxi|cab|courier)/.source;
const actionEn = new RegExp(String.raw`\b(?:order (?:me|us)|order [^.!?\n]{1,70} from|place an order|call (?:(?:a|an|the|my) )?${callObjectsEn}|${bookingVerbsEn} (?:(?:me|us|a|an|the|my|our) )*${bookingObjectsEn})\b`);
const personVi = /(?:toi|minh|em|anh|chi|tui minh|chung toi|chung minh)/.source;
const helpCueVi = `(?:giup|ho|gium)(?: ${personVi})? `;
const helpVi = `(?:${helpCueVi})?`;
const numberVi = /(?:mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi|\d+)/.source;
const bookingVerbsVi = /(?:goi|dat|keu|book)/.source;
const changeVerbsVi = /(?:huy|doi)/.source;
const bookingObjectsVi = /(?:tho|nguoi|xe|taxi|grab|ben giao hang|nha cung cap|cua hang|do an|nuoc|hang|mon|ve|lich|cho|phong|ban)/.source;
const changeObjectsVi = /(?:ve|lich hen|phong)/.source;
const actionVi = new RegExp(`\\b${bookingVerbsVi} ${helpVi}(?:${numberVi} )?(?:(?:chiec|nguoi|chai|phan|suat) )?${bookingObjectsVi}\\b`);
const orderForDeliveryVi = new RegExp(`\\bdat ${helpVi}${numberVi} [^.!?\\n]{1,70}\\bgiao (?:toi|den|ve)\\b`);
const changeBookingVi = new RegExp(`\\b${changeVerbsVi} ${helpVi}${changeObjectsVi}\\b`);
const delegatePartyVi = new RegExp(`\\b(?:nho(?: ${personVi})? )?(?:goi|dat|keu) ${helpVi}(?:ben|phia) (?!canh\\b|trai\\b|phai\\b|tren\\b|duoi\\b|trong\\b|ngoai\\b|doi dien\\b)[a-z0-9]+\\b`);
const messageEn = /^(?:(?:please|help me) )?(?:text|message|reply)\b/;
const messageVi = /^(?:(?:hay|lam on|giup(?: (?:toi|minh|em|anh|chi))?) )?(?:nhan(?: tin)?|viet (?:tin(?: nhan)?|loi nhan|thu)|tra loi)\b/;
const partyInformationVi = /^(?:(?:toi|minh|em|anh|chi) )?(?:(?:can|muon|hay|lam on) )?(?:so sanh|(?:lap )?bao gia|liet ke|ghi chu)\b/;

// Allow the wider object phrase in requests with a direct verb or an explicit cue
// after background. The gap must stay inside the object phrase.
function directRequestLead(cue: string): string {
    return String.raw`(?:^(?:${cue})?|[.!?,;\n] *(?:${cue}))`;
}

const cueEn = /please |(?:can|could|would|will) you (?:please )?|help me (?:to )?|(?:i|we) (?:need|want|would like) you to /.source;
const numberEn = /(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)/.source;
const objectLeadEn = `(?:(?:me|us) )?(?:(?:a|an|the|my|our) )?(?:${numberEn} )?`;
const modifiersEn = /(?:(?!(?:and|as|at|about|before|by|for|from|how|if|in|into|of|on|or|that|to|when|where|whether|with)\b)[a-z0-9]+(?:-[a-z0-9]+)* ){0,3}/.source;
const objectPhraseEn = `${objectLeadEn}${modifiersEn}`;
// A finite verb after the noun can make it the subject of a statement.
const eventPredicateEn = / (?:am|are|is|was|were|have|has|had|begins?|began|end(?:s|ed)?|happen(?:s|ed)?|last(?:s|ed)?|meets?|met|start(?:s|ed)?|takes? place|took place)\b/.source;
const directActionEn = new RegExp(
    `${directRequestLead(cueEn)}(?:`
    + `${bookingVerbsEn} ${objectPhraseEn}(?:${bookingObjectsEn}|seats?)`
    + `|call ${objectPhraseEn}${callObjectsEn}`
    + `|order ${objectPhraseEn}(?:food|meals?|pizzas?|takeout))\\b(?!${eventPredicateEn})`,
);

const objectCueVi = `(?:cho ${personVi} |${helpCueVi})`;
const cueVi = `hay |lam on |ban co the |nho(?: (?:${personVi}|ban))? |giup(?: ${personVi})? `
    + `|(?=(?:${bookingVerbsVi}|${changeVerbsVi}) ${objectCueVi})`;
const objectLeadVi = `(?:${objectCueVi})?(?:${numberVi} )?(?:(?:chiec|nguoi|chai|phan|suat) )?`;
// Attribute names and clause connectors cannot modify a bookable object here.
const objectBoundaryVi = /(?:cau hoi|cho|cua|de|den|gia|hoac|khi|la|mat khau|mau|moi nguoi|tai|ten|trong|tu|va|ve|voi)/.source;
const modifiersVi = String.raw`(?:(?!${objectBoundaryVi}\b)[a-z0-9]+(?:-[a-z0-9]+)* ){0,3}`;
const howQuestionVi = /[^.!?,;\n]*\b(?:the nao|lam sao|bang cach nao)\b/.source;
const objectPhraseVi = `(?!${howQuestionVi})${objectLeadVi}${modifiersVi}`;
const directActionVi = new RegExp(
    `${directRequestLead(cueVi)}(?:`
    + `${bookingVerbsVi} ${objectPhraseVi}${bookingObjectsVi}`
    + `|${changeVerbsVi} ${objectPhraseVi}${changeObjectsVi})\\b`,
);

export function homeSpecExternalRequest(goal: string, detail: string): 'action' | 'hazard' | null {
    const description = normalizeRequestText(goal);
    if (hasPhysicalSafetyConcern(description, normalizeRequestText(detail))) return 'hazard';
    if (isDocumentRequest(description) || messageEn.test(description) || messageVi.test(description) || partyInformationVi.test(description)
        || findHomeSpecDeliverable([goal.trim()])) return null;
    return [actionEn, actionVi, orderForDeliveryVi, changeBookingVi, delegatePartyVi, directActionEn, directActionVi]
        .some(action => action.test(description)) ? 'action' : null;
}
