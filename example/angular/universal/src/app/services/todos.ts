import { Todo } from '../models/todo';
import { Read, RequiresAuth, rpc, serviceFactory } from 'ts-rpc-reflect';
import { TransferState } from 'ts-rpc-angular';
import { Injectable } from '@angular/core';
import { StaticInMemoryTokenHandler } from 'ts-rpc-lib';

@Injectable({
  providedIn: 'root',
  useFactory: () => serviceFactory(TodosService)
})
export abstract class TodosService {
  @RequiresAuth(StaticInMemoryTokenHandler)
  @TransferState() @Read() getAll(): Promise<Todo[]> { return rpc(); }
  createTodo(todo: Partial<Todo>): Promise<Todo> { return rpc(); }
  
  @RequiresAuth(StaticInMemoryTokenHandler)
  updateTodo(todo: Todo): Promise<Todo> { return rpc(); }

  @RequiresAuth(StaticInMemoryTokenHandler)
  deleteTodo({ id }: { id: string }): Promise<void> { return rpc(); }
}
