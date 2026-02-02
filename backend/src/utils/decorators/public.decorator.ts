import { SetMetadata } from '@nestjs/common';

export const META_IS_PUBLIC = Symbol('isPublic');
export const Public = () => SetMetadata(META_IS_PUBLIC, true);
