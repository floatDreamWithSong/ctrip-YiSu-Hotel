import { request } from "../request";
import type { Realm } from '@yisu/shared';

// Define the expected response type for getSelf
interface SelfInfo {
  id: number;
  username: string;
  email: string;
  realm: Realm;
}

export const userApi = {
  getSelf: () => request<SelfInfo>({
    url: '/user/self',
    method: 'GET',
  }),
};
