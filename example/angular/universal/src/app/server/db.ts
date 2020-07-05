import { Sequelize, STRING, BOOLEAN, Model } from 'sequelize';
import { Todo } from '../models/todo';
import { BuildOptions } from 'sequelize';

const sequelize = new Sequelize('tsrpcdb', 'postgres', '', {
  host: process.env.DB_HOST || '0.0.0.0',
  dialect: 'postgres',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: false
  }
});

// We need to declare an interface for our model that is basically what our class would be
interface TodoModel extends Model, Todo {}

// Need to declare the static model so `findOne` etc. use correct types.
type TodoModelStatic = typeof Model & (new (values?: object, options?: BuildOptions) => TodoModel);

export const TodoOrm =  sequelize.define('todos', {
  label: STRING,
  completed: BOOLEAN
}) as TodoModelStatic;

declare const Zone: any;

const wrap = <A, B = never, C = never, D = never, E = never>(
  fn: (b?: B, c?: C, d?: D, e?: E) => Promise<A>
) => (...args: any[]): Promise<A> => {
  const task = Zone.current.scheduleMacroTask(
    'ZoneMacroTaskWrapper.subscribe',
    () => {},
    undefined,
    () => {},
    () => {}
  );
  return fn(...args).finally(() => task.invoke(Zone.current));
};

export const findAll = wrap<Todo[]>(TodoOrm.findAll.bind(TodoOrm));
export const create = wrap<Todo, Todo>(TodoOrm.create.bind(TodoOrm));
export const update = wrap<Todo>(TodoOrm.update.bind(TodoOrm));
export const destroy = wrap<void, { where: any }>(TodoOrm.destroy.bind(TodoOrm));
