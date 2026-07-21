'use client';
import { Tag } from 'antd';
import { FC, useEffect, useState } from 'react';
import {
    countOpenLinkedPulls,
    filterLinkedPullItems,
    type GhSearchItem,
} from '@/5_shared/utils/githubLinkedPulls';

type Props = {
    fullName: string;
    issueNumber: number;
};

const cacheKey = (fullName: string, issueNumber: number) =>
    `lb-open-pr:${fullName}#${issueNumber}`;

const CACHE_TTL_MS = 5 * 60 * 1000;

function readCachedCount(key: string): number | null {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { n: number; t: number };
        if (Date.now() - parsed.t > CACHE_TTL_MS) return null;
        return typeof parsed.n === 'number' ? parsed.n : null;
    } catch {
        return null;
    }
}

function writeCachedCount(key: string, n: number) {
    try {
        sessionStorage.setItem(key, JSON.stringify({ n, t: Date.now() }));
    } catch {
        // ignore quota / private mode
    }
}

/**
 * Lightweight client badge: open PR count for a bounty issue (#76).
 * Session-cached to limit unauthenticated GitHub search traffic.
 */
const OpenPrBadge: FC<Props> = ({ fullName, issueNumber }) => {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        const key = cacheKey(fullName, issueNumber);
        const cached = readCachedCount(key);
        if (cached !== null) {
            setCount(cached);
            return;
        }

        const q = encodeURIComponent(
            `repo:${fullName} is:pr is:open ${issueNumber} in:title,body`,
        );
        fetch(`https://api.github.com/search/issues?q=${q}&per_page=10`, {
            // Browser sets User-Agent; Accept is enough for public search.
            headers: { Accept: 'application/vnd.github+json' },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled || !data) return;
                const items = Array.isArray(data.items)
                    ? (data.items as GhSearchItem[])
                    : [];
                const n = countOpenLinkedPulls(
                    filterLinkedPullItems(items, issueNumber),
                );
                writeCachedCount(key, n);
                setCount(n);
            })
            .catch(() => {
                if (!cancelled) setCount(null);
            });
        return () => {
            cancelled = true;
        };
    }, [fullName, issueNumber]);

    if (!count) return null;
    return (
        <Tag color="blue" style={{ marginLeft: 8 }}>
            {count} open PR{count === 1 ? '' : 's'}
        </Tag>
    );
};

export { OpenPrBadge };
