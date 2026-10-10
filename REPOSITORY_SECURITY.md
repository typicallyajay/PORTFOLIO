# Repository access and code protection

This repository is public so visitors can view the portfolio source. Public
visibility does not grant anyone permission to push changes to this repository.
Visitors can still fork it or open pull requests; those are proposals and do not
change this repository unless an authorized maintainer applies them.

## Protected branch policy

The `main` branch is configured to:

- Allow pushes only from the `typicallyajay` GitHub account.
- Enforce the restriction for administrators as well.
- Prevent force pushes and branch deletion.

Only the repository owner is an active collaborator. Keep collaborator and team
access limited to people who should be able to change the source. Review access
under **Settings → Collaborators** and the `main` branch rule under
**Settings → Branches**.

The rule intentionally does not require pull-request approvals: with one
authorized maintainer, requiring another approval could prevent that maintainer
from shipping updates. Review proposed pull requests before integrating them.

## Limits

This protects the canonical `main` branch; it cannot prevent public users from
copying or forking public source code. Repository owners and organization
administrators retain control of GitHub settings and can change the protection
policy. To restrict who can view the source, change the repository visibility to
private and review the invited collaborators.
