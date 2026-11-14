import { env } from '../config/env';

export const PASSWORD = env.uiPassword;

export const ERRORS = {
  locked: 'Epic sadface: Sorry, this user has been locked out.',
  mismatch: 'Epic sadface: Username and password do not match any user in this service',
  noUser: 'Epic sadface: Username is required',
  noPassword: 'Epic sadface: Password is required',
} as const;
