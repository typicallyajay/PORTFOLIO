# Repository access and code protection

This repository is public so visitors can view the portfolio source. Public
visibility does not grant anyone permission to push changes to this repository.
Visitors can still fork it or open pull requests; those are proposals and do not
change this repository unless an authorized maintainer applies them.

## Protected branch policy

The `main` branch is protected by the **Owner-only main updates** ruleset:

- Restrict updates to the explicitly allow-listed `typicallyajay` account.
- Prevent force pushes and branch deletion.

Only the repository owner is an active collaborator and the sole ruleset bypass
actor. Keep collaborator access limited to people who should be able to change
the source. Review access under **Settings → Collaborators** and the ruleset
under **Settings → Rules → Rulesets**.

The ruleset does not require pull-request approvals: with one authorized
account, requiring another approval could prevent that maintainer from
shipping updates. Review proposed pull requests before integrating them.

## Limits

This protects the canonical `main` branch; it cannot prevent public users from
copying or forking public source code. The allow-listed account can bypass the
ruleset, and the repository owner retains control of GitHub settings. Recheck
the ruleset and collaborator access whenever either changes. To restrict who can
view the source, change the repository visibility to private and review the
invited collaborators.
