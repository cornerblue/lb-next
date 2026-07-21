import { filterLinkedPullItems } from './githubLinkedPulls';

describe('filterLinkedPullItems', () => {
    it('maps open PRs and sorts open before closed', () => {
        const items = [
            {
                number: 1,
                title: 'fix stuff',
                html_url: 'https://github.com/o/r/pull/1',
                state: 'closed',
                pull_request: { url: 'https://api.github.com/repos/o/r/pulls/1' },
                user: { login: 'alice' },
            },
            {
                number: 2,
                title: 'feat: closes #10',
                html_url: 'https://github.com/o/r/pull/2',
                state: 'open',
                draft: true,
                pull_request: { url: 'https://api.github.com/repos/o/r/pulls/2' },
                user: { login: 'bob' },
            },
        ];
        const result = filterLinkedPullItems(items, 10);
        expect(result).toHaveLength(2);
        expect(result[0].number).toBe(2);
        expect(result[0].state).toBe('open');
        expect(result[0].draft).toBe(true);
        expect(result[0].user_login).toBe('bob');
        expect(result[1].state).toBe('closed');
    });

    it('skips non-PR issues', () => {
        const items = [
            {
                number: 3,
                title: 'not a pr',
                html_url: 'https://github.com/o/r/issues/3',
                state: 'open',
                user: { login: 'x' },
            },
        ];
        expect(filterLinkedPullItems(items, 3)).toHaveLength(0);
    });
});
