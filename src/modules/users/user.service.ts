import { NotFoundError } from '../../errors/not-found-error';
import type { UserRepository, UserWithRoles } from './user.repository';

// Never return passwordHash to clients: map to a public shape.
export const toPublicUser = (user: UserWithRoles) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles.map((role) => role.name),
});

export class UserService {
    private readonly userRepository: UserRepository;

    // Awilix injects the named dependencies (PROXY mode)
    constructor({ userRepository }: { userRepository: UserRepository }) {
        this.userRepository = userRepository;
    }

    async getById(id: string) {
        const user = await this.userRepository.findWithRoles(id);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return toPublicUser(user);
    }
}
