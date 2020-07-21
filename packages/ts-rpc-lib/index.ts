import {TokenHandler} from 'ts-rpc-reflect';

export * from './services';

export class InMemoryTokenHandler implements TokenHandler {
  private token: any;

  getToken(): string {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
  }
}

export const StaticInMemoryTokenHandler = new InMemoryTokenHandler();
