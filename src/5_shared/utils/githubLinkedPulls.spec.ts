/**
 * Pure unit tests for filterLinkedPullItems (shipped module).
 * Run: npx tsx --test src/5_shared/utils/githubLinkedPulls.spec.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    countOpenLinkedPulls,
    filterLinkedPullItems,
    type GhSearchItem,
} from './githubLinkedPulls';

describe('filterLinkedPullItems', () => {
    it('maps open PRs and sorts open before closed', () => {
        const items: GhSearchItem[] = [
            {
                number: 1,
                title: 'fix stuff',
                html_url: 'https://github.com/o/r/pull/1',
                state: 'closed',
                pull_request: {
                    url: 'https://api.github.com/repos/o/r/pulls/1',
                },
                user: { login: 'alice' },
            },
            {
                number: 2,
                title: 'feat: closes #10',
                html_url: 'https://github.com/o/r/pull/2',
                state: 'open',
                draft: true,
                pull_request: {
                    url: 'https://api.github.com/repos/o/r/pulls/2',
                },
                user: { login: 'bob' },
            },
        ];
        const result = filterLinkedPullItems(items, 10);
        assert.equal(result.length, 2);
        assert.equal(result[0].number, 2);
        assert.equal(result[0].state, 'open');
        assert.equal(result[0].draft, true);
        assert.equal(result[0].user_login, 'bob');
        assert.equal(result[1].state, 'closed');
        assert.equal(result[1].user_login, 'alice');
    });

    it('skips non-PR issues', () => {
        const items: GhSearchItem[] = [
            {
                number: 3,
                title: 'not a pr',
                html_url: 'https://github.com/o/r/issues/3',
                state: 'open',
                user: { login: 'x' },
            },
        ];
        assert.equal(filterLinkedPullItems(items, 3).length, 0);
    });

    it('accepts PRs identified by /pull/ URL without pull_request field', () => {
        const items: GhSearchItem[] = [
            {
                number: 9,
                title: 'linked',
                html_url: 'https://github.com/o/r/pull/9',
                state: 'open',
                user: { login: 'c' },
            },
        ];
        const result = filterLinkedPullItems(items, 1);
        assert.equal(result.length, 1);
        assert.equal(result[0].number, 9);
    });

    it('sorts same-state by higher number first', () => {
        const items: GhSearchItem[] = [
            {
                number: 4,
                title: 'a',
                html_url: 'https://github.com/o/r/pull/4',
                state: 'open',
                pull_request: { url: 'x' },
            },
            {
                number: 7,
                title: 'b',
                html_url: 'https://github.com/o/r/pull/7',
                state: 'open',
                pull_request: { url: 'x' },
            },
        ];
        const result = filterLinkedPullItems(items, 1);
        assert.deepEqual(
            result.map((p) => p.number),
            [7, 4],
        );
    });

    it('defaults missing user login to unknown', () => {
        const items: GhSearchItem[] = [
            {
                number: 5,
                title: 'solo',
                html_url: 'https://github.com/o/r/pull/5',
                state: 'open',
                pull_request: { url: 'x' },
            },
        ];
        assert.equal(filterLinkedPullItems(items, 5)[0].user_login, 'unknown');
    });
});

describe('countOpenLinkedPulls', () => {
    it('counts only open state', () => {
        const pulls = filterLinkedPullItems(
            [
                {
                    number: 1,
                    title: 'a',
                    html_url: 'https://github.com/o/r/pull/1',
                    state: 'closed',
                    pull_request: { url: 'x' },
                },
                {
                    number: 2,
                    title: 'b',
                    html_url: 'https://github.com/o/r/pull/2',
                    state: 'open',
                    pull_request: { url: 'x' },
                },
            ],
            1,
        );
        assert.equal(countOpenLinkedPulls(pulls), 1);
    });
});
