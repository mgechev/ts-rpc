import { Todo } from '../models/todo';
import { Read, TransferState, rpc } from 'ts-rpc-reflect';

export abstract class TodosService {
  initialTodos: Todo[] = [];
  @TransferState('initialTodos') @Read() getAll(): Promise<Todo[]> { return rpc(); }
  createTodo(todo: Partial<Todo>): Promise<Todo> { return rpc(); }
  updateTodo(todo: Todo): Promise<Todo> { return rpc(); }
  deleteTodo({ id }: { id: string }): Promise<void> { return rpc(); }
}
