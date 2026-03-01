import { Profile } from '../../../common/entities';
import { UpdateUserDto } from '../dto/update-user.dto';

export interface UsersRepository {
  findById(id: string): Promise<Profile | null>;
  findPublicById(id: string): Promise<Partial<Profile> | null>;
  update(id: string, dto: UpdateUserDto): Promise<Profile>;
}
