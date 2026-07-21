import { Flex, Tag, Typography } from 'antd';
import Link from 'next/link';
import { FC } from 'react';
import { LinkedPullRequest } from '@/5_shared/utils/githubLinkedPulls';

type Props = {
    pulls: LinkedPullRequest[];
};

/**
 * Lists GitHub PRs that reference this bounty issue (LB issue page).
 */
const IssueExistingPulls: FC<Props> = ({ pulls }) => {
    if (!pulls.length) return null;

    const openCount = pulls.filter((p) => p.state === 'open').length;

    return (
        <Flex vertical gap="small">
            <Flex align="center" gap="small">
                <Typography className="opacity50">Existing PRs</Typography>
                <Tag color={openCount ? 'blue' : 'default'}>
                    {openCount ? `${openCount} open` : `${pulls.length} closed`}
                </Tag>
            </Flex>
            <Flex vertical gap={6}>
                {pulls.map((pr) => (
                    <Flex key={pr.number} align="center" gap="small" wrap="wrap">
                        <Tag color={pr.state === 'open' ? 'processing' : 'default'}>
                            {pr.draft ? 'draft' : pr.state}
                        </Tag>
                        <Link
                            href={pr.html_url}
                            target="_blank"
                            rel="nofollow noreferrer"
                        >
                            #{pr.number} {pr.title}
                        </Link>
                        <Typography className="opacity50">
                            @{pr.user_login}
                        </Typography>
                    </Flex>
                ))}
            </Flex>
        </Flex>
    );
};

export { IssueExistingPulls };
