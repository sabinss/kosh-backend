// Single source of truth for every permission the app can check.
//
// To add a feature:
//   1. Add its codes here (format: "<resource>:<action>").
//   2. Give them to the right roles in role-defaults.ts.
//   3. Use requirePermission('<code>') on the new routes.
//   4. Run `npm run db:seed` (also run in every deploy) so the database knows them.
//
// Nothing is granted by being listed here. Listing only makes a code known.

export interface PermissionDef {
    code: string;
    feature: string;
    description: string;
}

export const PERMISSIONS = [
    // Meetings
    { code: 'meeting:view', feature: 'meeting', description: 'View meetings' },
    {
        code: 'meeting:create',
        feature: 'meeting',
        description: 'Schedule meetings',
    },
    {
        code: 'meeting:update',
        feature: 'meeting',
        description: 'Edit meetings',
    },
    {
        code: 'meeting:delete',
        feature: 'meeting',
        description: 'Delete meetings',
    },

    // Members
    { code: 'member:view', feature: 'member', description: 'View members' },
    { code: 'member:create', feature: 'member', description: 'Add members' },
    { code: 'member:update', feature: 'member', description: 'Edit members' },
    { code: 'member:delete', feature: 'member', description: 'Remove members' },

    // Ledger (accounting entries: posted, reversed, never edited in place)
    {
        code: 'ledger:view',
        feature: 'ledger',
        description: 'View ledger entries',
    },
    {
        code: 'ledger:post',
        feature: 'ledger',
        description: 'Post ledger entries',
    },
    {
        code: 'ledger:reverse',
        feature: 'ledger',
        description: 'Reverse ledger entries',
    },

    // Loans
    { code: 'loan:view', feature: 'loan', description: 'View loans' },
    {
        code: 'loan:create',
        feature: 'loan',
        description: 'Create loan requests',
    },
    {
        code: 'loan:approve',
        feature: 'loan',
        description: 'Approve or reject loans',
    },
    {
        code: 'loan:record_payment',
        feature: 'loan',
        description: 'Record loan repayments',
    },

    // Reports and day book
    { code: 'report:view', feature: 'report', description: 'View reports' },
    { code: 'report:export', feature: 'report', description: 'Export reports' },
    { code: 'daybook:view', feature: 'daybook', description: 'View day book' },

    // System administration
    { code: 'user:view', feature: 'user', description: 'View users' },
    { code: 'user:create', feature: 'user', description: 'Create users' },
    {
        code: 'user:assign_role',
        feature: 'user',
        description: 'Assign roles to users',
    },
] as const satisfies readonly PermissionDef[];

export type PermissionCode = (typeof PERMISSIONS)[number]['code'];
