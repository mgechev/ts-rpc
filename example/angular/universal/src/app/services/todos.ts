import { Todo } from '../models/todo';
import { Middleware, Read, rpc } from 'ts-rpc-reflect';
import { transferState } from 'ts-rpc-angular/src/client';

export abstract class TodosService {
  @Middleware(transferState('todo-app')) @Read() getAll(): Promise<Todo[]> { return rpc(); }
  createTodo(todo: Partial<Todo>): Promise<Todo> { return rpc(); }
  updateTodo(todo: Todo): Promise<Todo> { return rpc(); }
  deleteTodo({ id }: { id: string }): Promise<void> { return rpc(); }
}
