import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { Redis } from '@upstash/redis';
import { SQLiteAtomicRecordAdapter } from '@/lib/storage-adapter';
import { isLoopbackHostname } from './browser-origin';

const defaults = { dailyUser: 20, dailySiteMicroUsd: 500_000 };
const namespace = 'home-spec-clarification-v1';
const threeDaysSeconds = 3 * 86400;

type Reservation = { id: string; day: string; account: string; microUsd: number };
type Limits = typeof defaults;
type Store = { reserve(reservation: Reservation, limits: Limits): Promise<boolean>; settle(reservation: Reservation, billed: number): Promise<void> };

function limits(): Limits {
    const count = Number(process.env.CVF_HOME_CLARIFICATION_DAILY_USER_LIMIT ?? defaults.dailyUser);
    const budget = Math.floor(Number(process.env.CVF_HOME_CLARIFICATION_DAILY_SITE_USD ?? 0.50) * 1_000_000);
    if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(budget) || budget < 0) {
        throw new Error('Invalid Home clarification limits');
    }
    return { dailyUser: count, dailySiteMicroUsd: budget };
}

function redisConfiguration() {
    if (process.env.CVF_STORAGE_ADAPTER_TYPE !== 'redis') return null;
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    return url?.startsWith('https://') && token ? { url, token } : null;
}

function isLocal(hostname: string) {
    return process.env.NETLIFY !== 'true' && !process.env.AWS_LAMBDA_FUNCTION_NAME
        && process.env.CVF_STORAGE_ADAPTER_TYPE !== 'redis' && isLoopbackHostname(hostname);
}

export function hasHomeClarificationBudgetStore(hostname: string): boolean {
    return isLocal(hostname) || redisConfiguration() !== null;
}

function localBudget(day: string) {
    const root = process.env.CVF_HOME_CLARIFICATION_BUDGET_DIRECTORY || path.join(process.cwd(), '.cvf', 'runtime', namespace);
    const dir = path.resolve(root, day);
    mkdirSync(dir, { recursive: true });
    return new SQLiteAtomicRecordAdapter(dir, namespace);
}

const sqliteStore: Store = {
    async reserve(reservation, cap) {
        return localBudget(reservation.day).transaction(rows => {
            const site = rows.find(row => row.id === 'site');
            const account = rows.find(row => row.id === reservation.account);
            const spend = counter(site?.value);
            const calls = counter(account?.value);
            if (calls >= cap.dailyUser || spend + reservation.microUsd > cap.dailySiteMicroUsd) return { writes: [], result: false };
            return { result: true, writes: [
                { id: 'site', expectedRevision: site?.revision ?? null, value: spend + reservation.microUsd },
                { id: reservation.account, expectedRevision: account?.revision ?? null, value: calls + 1 },
                { id: reservation.id, expectedRevision: null, value: reservation.microUsd },
            ] };
        });
    },
    async settle(reservation, billed) {
        localBudget(reservation.day).transaction(rows => {
            const site = rows.find(row => row.id === 'site');
            const claim = rows.find(row => row.id === reservation.id);
            if (!site || !claim || claim.value !== reservation.microUsd) throw new Error('Home clarification reservation unavailable');
            return { result: undefined, writes: [
                { id: site.id, expectedRevision: site.revision, value: counter(site.value) - reservation.microUsd + billed },
                { id: claim.id, expectedRevision: claim.revision, value: 0 },
            ] };
        });
    },
};

function counter(value: unknown) {
    if (value === undefined) return 0;
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid Home clarification counter');
    return value;
}

const redisReserve = `
local key, user, id = KEYS[1], ARGV[1], ARGV[2]
local amount, maxUser, maxSite = tonumber(ARGV[3]), tonumber(ARGV[4]), tonumber(ARGV[5])
local calls = tonumber(redis.call('HGET', key, user) or '0')
local spend = tonumber(redis.call('HGET', key, 'site') or '0')
if calls >= maxUser or spend + amount > maxSite or redis.call('HEXISTS', key, id) == 1 then return 0 end
redis.call('HSET', key, user, calls + 1, 'site', spend + amount, id, amount)
redis.call('EXPIRE', key, ARGV[6])
return 1`;

const redisSettle = `
local key, id = KEYS[1], ARGV[1]
local reserve, billed = tonumber(ARGV[2]), tonumber(ARGV[3])
if tonumber(redis.call('HGET', key, id) or '-1') ~= reserve then return 0 end
redis.call('HINCRBY', key, 'site', billed - reserve)
redis.call('HSET', key, id, 0)
return 1`;

function redisStore(config: NonNullable<ReturnType<typeof redisConfiguration>>): Store {
    const redis = new Redis({ ...config, retry: false });
    return {
        async reserve({ day, account, id, microUsd }, cap) {
            return await redis.eval(redisReserve, [`cvf:${namespace}:${day}`],
                [account, id, microUsd, cap.dailyUser, cap.dailySiteMicroUsd, threeDaysSeconds]) === 1;
        },
        async settle({ day, id, microUsd }, billed) {
            if (await redis.eval(redisSettle, [`cvf:${namespace}:${day}`], [id, microUsd, billed]) !== 1) {
                throw new Error('Home clarification reservation unavailable');
            }
        },
    };
}

export async function reserveHomeClarification(hostname: string, accountId: string, microUsd: number) {
    const config = redisConfiguration();
    const store = config ? redisStore(config) : isLocal(hostname) ? sqliteStore : null;
    if (!store) throw new Error('Home clarification budget store unavailable');
    const reservation = {
        id: `request:${randomUUID()}`, day: new Date().toISOString().slice(0, 10), microUsd,
        account: `account:${createHash('sha256').update(accountId).digest('hex')}`,
    };
    if (!await store.reserve(reservation, limits())) return null;
    return async (billed: number) => {
        if (!Number.isSafeInteger(billed) || billed < 0 || billed > microUsd) throw new Error('Unverified Home clarification cost');
        await store.settle(reservation, billed);
    };
}
