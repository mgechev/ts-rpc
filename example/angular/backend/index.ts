import { TodosService as TodosService1 } from '../client/src/app/services/todos';
import { GRPC, start } from './grpc';
import { Todo } from '../client/src/app/models/todo';

const todo: Todo = {
  completed: true,
  id: '2',
  label: '123'
};

@GRPC()
class TodosService implements TodosService1 {
  getAll(): Promise<Array<Todo>> {
    return Promise.resolve([todo]);
  }
  createTodo(_: Partial<Todo>): Promise<Todo> {
    return Promise.resolve(todo);
  }
  updateTodo(todo: Todo): Promise<Todo> {
    return Promise.resolve(todo);
  }
  deleteTodo({ id }: { id: string }): Promise<void> {
    return Promise.resolve();
  }
}

start();
