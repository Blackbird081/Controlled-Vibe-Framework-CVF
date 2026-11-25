import { hasPhysicalSafetyConcern, isDocumentRequest, normalizeRequestText } from '@/lib/physical-safety';
import { findHomeSpecDeliverable } from './home-spec-deliverable';

const actionEn = /\b(?:order (?:me|us)|order [^.!?\n]{1,70} from|place an order|call (?:(?:a|an|the|my) )?(?:plumber|technician|electrician|repair service|taxi|cab|courier)|(?:book|reserve|schedule|reschedule|cancel) (?:(?:me|us|a|an|the|my|our) )*(?:flights?|tickets?|tables?|rooms?|appointments?|meetings?|reservations?|taxis?|cabs?|couriers?|delivery|deliveries))\b/;
const personVi = /(?:toi|minh|em|anh|chi|tui minh|chung toi|chung minh)/.source;
const helpVi = `(?:(?:giup|ho|gium)(?: ${personVi})? )?`;
const numberVi = /(?:mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi|\d+)/.source;
const actionVi = new RegExp(`\\b(?:goi|dat|keu|book) ${helpVi}(?:${numberVi} )?(?:(?:chiec|nguoi|chai|phan|suat) )?(?:tho|nguoi|xe|taxi|grab|ben giao hang|nha cung cap|cua hang|do an|nuoc|hang|mon|ve|lich|cho|phong|ban)\\b`);
const orderForDeliveryVi = new RegExp(`\\bdat ${helpVi}${numberVi} [^.!?\\n]{1,70}\\bgiao (?:toi|den|ve)\\b`);
const changeBookingVi = new RegExp(`\\b(?:huy|doi) ${helpVi}(?:ve|lich hen|phong)\\b`);
const delegatePartyVi = new RegExp(`\\b(?:nho(?: ${personVi})? )?(?:goi|dat|keu) ${helpVi}(?:ben|phia) (?!canh\\b|trai\\b|phai\\b|tren\\b|duoi\\b|trong\\b|ngoai\\b|doi dien\\b)[a-z0-9]+\\b`);
const messageEn = /^(?:(?:please|help me) )?(?:text|message|reply)\b/;
const messageVi = /^(?:(?:hay|lam on|giup(?: (?:toi|minh|em|anh|chi))?) )?(?:nhan(?: tin)?|viet (?:tin(?: nhan)?|loi nhan|thu)|tra loi)\b/;
const partyInformationVi = /^(?:(?:toi|minh|em|anh|chi) )?(?:(?:can|muon|hay|lam on) )?(?:so sanh|(?:lap )?bao gia|liet ke|ghi chu)\b/;

export function homeSpecExternalRequest(goal: string, detail: string): 'action' | 'hazard' | null {
    const description = normalizeRequestText(goal);
    if (hasPhysicalSafetyConcern(description, normalizeRequestText(detail))) return 'hazard';
    if (isDocumentRequest(description) || messageEn.test(description) || messageVi.test(description) || partyInformationVi.test(description)
        || findHomeSpecDeliverable([goal.trim()])) return null;
    return [actionEn, actionVi, orderForDeliveryVi, changeBookingVi, delegatePartyVi].some(action => action.test(description)) ? 'action' : null;
}
