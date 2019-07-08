import { TodosService as TodosService1 } from '../client/src/app/services/todos';
import { GRPC, listen } from 'ts-rpc-server';
import { Todo } from '../client/src/app/models/todo';
import { TodoOrm } from './db';

@GRPC()
class TodosService implements TodosService1 {
  getAll(): Promise<Todo[]> {
    return Promise.resolve(TodoOrm.findAll()).then(todos =>
      todos.sort((a: Todo, b: Todo) => parseInt(a.id) - parseInt(b.id))
    );
  }

  createTodo(todo: Todo): Promise<Todo> {
    return Promise.resolve(TodoOrm.create(todo)).then(({ id }: { id: string }) => {
      todo.id = id;
      return todo;
    });
  }

  updateTodo(todo: Todo): Promise<Todo> {
    return Promise.resolve(
      TodoOrm.update(todo, {
        where: { id: todo.id }
      })
    ).then(_ => {
      return todo;
    });
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
