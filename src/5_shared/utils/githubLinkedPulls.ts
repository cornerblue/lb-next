/**
 * Resolve GitHub pull requests that reference a bounty issue.
 * Used to surface "Existing PRs" on the issue detail page (#76).
 */

export type LinkedPullRequest = {
    number: number;
    title: string;
    html_url: string;
    state: 'open' | 'closed';
    draft: boolean;
    user_login: string;
};

export type GhSearchItem = {
    number: number;
    title: string;
    html_url: string;
    state: string;
    draft?: boolean;
    pull_request?: { url: string };
    user?: { login?: string };
};

/**
 * Pure map/sort: keep PR search hits, open first, then highest number.
 * Search query is already scoped to the repo + issue number.
 */
export function filterLinkedPullItems(
    items: GhSearchItem[],
    _issueNumber: number,
): LinkedPullRequest[] {
    const out: LinkedPullRequest[] = [];
    for (const item of items) {
        if (!item.pull_request && !item.html_url?.includes('/pull/')) continue;
        out.push({
            number: item.number,
            title: item.title ?? '',
            html_url: item.html_url ?? '',
            state: item.state === 'closed' ? 'closed' : 'open',
            draft: Boolean(item.draft),
            user_login: item.user?.login ?? 'unknown',
        });
    }
    out.sort((a, b) => {
        if (a.state !== b.state) return a.state === 'open' ? -1 : 1;
        return b.number - a.number;
    });
    return out;
}

export function countOpenLinkedPulls(pulls: LinkedPullRequest[]): number {
    return pulls.filter((p) => p.state === 'open').length;
}

export async function fetchLinkedPullRequests(
    fullName: string,
    issueNumber: number,
): Promise<LinkedPullRequest[]> {
    if (!fullName || !issueNumber) return [];
    const q = encodeURIComponent(
        `repo:${fullName} is:pr ${issueNumber} in:title,body`,
    );
    try {
        const res = await fetch(
            `https://api.github.com/search/issues?q=${q}&per_page=10`,
            {
                headers: {
                    Accept: 'application/vnd.github+json',
                    'User-Agent': 'Lightning-Bounties-lb-next',
                },
                // Cache for 5 minutes on Next.js server
                next: { revalidate: 300 },
            } as RequestInit,
        );
        if (!res.ok) return [];
        const data = (await res.json()) as { items?: GhSearchItem[] };
        return filterLinkedPullItems(data.items ?? [], issueNumber);
    } catch {
        return [];
    }
}
