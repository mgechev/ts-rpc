import {Injectable} from '@angular/core';
import {serviceFactory} from 'ts-rpc-reflect';
import {AuthService} from 'ts-rpc-lib';

@Injectable({
  providedIn: 'root',
  useFactory: () => serviceFactory(SimpleAuthService)
})
export abstract class SimpleAuthService extends AuthService {}
