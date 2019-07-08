import { InjectionToken } from '@angular/core';
import { Todo } from '../models/todo';
import { Service } from 'ts-rpc';

export const TodosServiceToken = new InjectionToken('TodosService');

export interface TodosService extends Service {
  getAll<Read>(): Promise<Todo[]>;
  createTodo(todo: Partial<Todo>): Promise<Todo>;
  updateTodo(todo: Todo): Promise<Todo>;
  deleteTodo({ id }: { id: string }): Promise<void>;
}
