import { TodosService as TodosService1 } from '../client/src/app/services/todos';
import { Service, listen } from 'ts-rpc-server';
import { Todo } from '../client/src/app/models/todo';
import { TodoOrm } from './db';

@Service()
class TodosService implements TodosService1 {
  async getAll(): Promise<Todo[]> {
    const todos = await Promise.resolve(TodoOrm.findAll());
    return todos.sort((a: Todo, b: Todo) => parseInt(a.id) - parseInt(b.id));
  }

  async createTodo(todo: Todo): Promise<Todo> {
    const { id } = await Promise.resolve(TodoOrm.create(todo));
    todo.id = id;
    return todo;
  }

  async updateTodo(todo: Todo): Promise<Todo> {
    const _ = await Promise.resolve(TodoOrm.update(todo, {
      where: { id: todo.id }
    }));
    return todo;
  }

  deleteTodo({ id }: { id: string }): Promise<void> {
    return Promise.resolve(
      TodoOrm.destroy({
        where: { id }
      }).then(() => Promise.resolve())
    );
  }
}

listen('0.0.0.0', 8081);
