export interface User {
  id: string;
  name: string;
  email: string;
  jwt: string;
  lastLogin?: Date;
  isAdmin: boolean;
  isAuth: boolean;
}
