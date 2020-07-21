import {rpc} from 'ts-rpc-reflect';

export interface LoginResponse {
  token: string;
}

export abstract class AuthService {
  login(username: string, password: string): Promise<LoginResponse | null> { return rpc(); };
}

export interface ServerLoginHandler {
  authenticate(username: string, password: string): string | null;
}

export class AuthServiceServer extends AuthService {
  private loginHandler: ServerLoginHandler;

  constructor(loginHandler: ServerLoginHandler) {
    super();
    this.loginHandler = loginHandler;
  }

  login(username: string, password: string): Promise<LoginResponse | null> {
    const userId = this.loginHandler.authenticate(username, password);
    if(userId != null) {
      // todo: create token for real
      return Promise.resolve({token: userId})
    }
    return Promise.resolve(null);
  }
}
