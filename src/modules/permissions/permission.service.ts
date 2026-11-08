import type { PermissionCode } from '../../common/permissions/registry';
import type { PermissionRepository } from './permission.repository';

export class PermissionService {
    private readonly permissionRepository: PermissionRepository;

    constructor({
        permissionRepository,
    }: {
        permissionRepository: PermissionRepository;
    }) {
        this.permissionRepository = permissionRepository;
    }

    // Reads the database on every check, so a role change takes effect on the
    // user's next request. Add caching later only if measurements need it.
    async userHas(userId: string, code: PermissionCode): Promise<boolean> {
        const codes = await this.permissionRepository.findCodesForUser(userId);
        return codes.includes(code);
    }

    async listUserPermissions(userId: string): Promise<string[]> {
        return this.permissionRepository.findCodesForUser(userId);
    }
}
