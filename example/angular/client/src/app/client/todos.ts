import {TodosService as TodosService1} from '../services/todos';
import {Injectable, Inject} from '@angular/core';
import {grpcUnary, FetchFn, Fetch, Host} from 'ts-rpc-client';
import {Todo} from '../models/todo';

@Injectable()
export class TodosService implements TodosService1 {
  private c: <T>(sideEffect: boolean, method: string, ...args: any[]) => Promise<T>;
  constructor(@Inject(Fetch) fetch: FetchFn, @Inject(Host) host: string) {
    this.c = grpcUnary.bind(null, fetch, host, 'TodosService');
  }
  getAll(): Promise<Array<Todo>> {
    return this.c<Array<Todo>>(false, 'getAll');
  }
  createTodo(todo: Partial<Todo>): Promise<Todo> {
    return this.c<Todo>(true, 'createTodo', todo);
  }
  updateTodo(todo: Todo): Promise<Todo> {
    return this.c<Todo>(true, 'updateTodo', todo);
  }
  deleteTodo({ id }: { id: string }): Promise<void> {
    return this.c<void>(true, 'deleteTodo', { id });
  }
}
