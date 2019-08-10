import { TodosService as TodosService1 } from './todos';
import { Service } from 'ts-rpc-server';
import { findAll, create, update, destroy } from './db';
import { Todo } from '../models/todo';

@Service()
export class TodosService extends TodosService1 {
  async getAll(): Promise<Todo[]> {
    const todos = await findAll();
    return todos.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
  }

  async createTodo(todo: Todo): Promise<Todo> {
    const { id } = await create(todo);
    todo.id = id;
    return todo;
  }

  async updateTodo(todo: Todo): Promise<Todo> {
    const _ = await update(todo, {
      where: { id: todo.id }
    });
    return todo;
  }

  deleteTodo({ id }: { id: string }): Promise<void> {
    return destroy({ where: { id } });
  }
}

