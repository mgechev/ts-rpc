// import { InjectionToken } from '@angular/core';
import { Todo } from '../models/todo';
import { Read } from 'ts-rpc-reflect';
// import { Service } from 'ts-rpc-client';

// export const TodosServiceToken = new InjectionToken('TodosService');

// export interface TodosService extends Service {
//   getAll<Read>(): Promise<Todo[]>;
//   createTodo(todo: Partial<Todo>): Promise<Todo>;
//   updateTodo(todo: Todo): Promise<Todo>;
//   deleteTodo({ id }: { id: string }): Promise<void>;
// }

export abstract class TodosService {
  @Read()
  getAll(): Promise<Todo[]> {
    throw new Error('');
  }

  createTodo(todo: Partial<Todo>): Promise<Todo> {
    throw new Error('');
  }

  updateTodo(todo: Todo): Promise<Todo> {
    throw new Error('');
  }

  deleteTodo({ id }: { id: string }): Promise<void> {
    throw new Error('');
  }
}
