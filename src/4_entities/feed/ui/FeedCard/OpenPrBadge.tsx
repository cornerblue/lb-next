'use client';
import { Tag } from 'antd';
import { FC, useEffect, useState } from 'react';

type Props = {
    fullName: string;
    issueNumber: number;
};

/**
 * Lightweight client badge: shows open PR count for a GitHub issue (issue #76).
 */
const OpenPrBadge: FC<Props> = ({ fullName, issueNumber }) => {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        const q = encodeURIComponent(
            `repo:${fullName} is:pr is:open ${issueNumber} in:title,body`,
        );
        fetch(`https://api.github.com/search/issues?q=${q}&per_page=5`, {
            headers: { Accept: 'application/vnd.github+json' },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled || !data) return;
                const n = Array.isArray(data.items) ? data.items.length : 0;
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
