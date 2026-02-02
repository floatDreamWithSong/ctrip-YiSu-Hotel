import { SetMetadata } from '@nestjs/common';

export const META_IS_FORCE_IDENTITY = Symbol('isForceIdentity');
export const ForceIdentity = () => SetMetadata(META_IS_FORCE_IDENTITY, true);