import type { PermissionCode } from './registry';

// Starting permissions for each role. Used when the database is first seeded
// and whenever `db:seed` runs (it only ADDS missing grants; it never removes
// a grant, so changes an admin made in the database survive redeploys).
//
// Proposed matrix: review before going to production.

export const ROLE_DEFAULTS = {
    // Runs the system. Gets every permission, including ones added later.
    super_admin: {
        description: 'Full system access: creates users and assigns roles',
        permissions: 'ALL',
    },
    president: {
        description: 'Organization leader: oversees meetings, approves loans',
        permissions: [
            'meeting:view',
            'meeting:create',
            'meeting:update',
            'member:view',
            'loan:view',
            'loan:approve',
            'ledger:view',
            'report:view',
            'report:export',
            'daybook:view',
        ],
    },
    treasury: {
        description: 'Handles money: members, loans, payments, ledger',
        permissions: [
            'meeting:view',
            'member:view',
            'member:create',
            'member:update',
            'loan:view',
            'loan:create',
            'loan:record_payment',
            'ledger:view',
            'ledger:post',
            'report:view',
            'report:export',
            'daybook:view',
        ],
    },
    member: {
        description: 'Ordinary member: read-only access to shared information',
        permissions: ['meeting:view', 'loan:view'],
    },
} as const satisfies Record<
    string,
    { description: string; permissions: 'ALL' | readonly PermissionCode[] }
>;

export type RoleName = keyof typeof ROLE_DEFAULTS;

export const SUPER_ADMIN_ROLE: RoleName = 'super_admin';
