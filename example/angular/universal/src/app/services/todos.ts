import { Todo } from '../models/todo';
import { Read, Metadata, rpc, serviceFactory } from 'ts-rpc-reflect';
import { TransferState } from 'ts-rpc-angular';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
  useFactory: () => serviceFactory(TodosService)
})
export abstract class TodosService {
  @Metadata(['authorization', 'bearer abc123'])
  @TransferState() @Read() getAll(): Promise<Todo[]> { return rpc(); }
  createTodo(todo: Partial<Todo>): Promise<Todo> { return rpc(); }
  updateTodo(todo: Todo): Promise<Todo> { return rpc(); }
  deleteTodo({ id }: { id: string }): Promise<void> { return rpc(); }
}
