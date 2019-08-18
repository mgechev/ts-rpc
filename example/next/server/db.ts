import { Sequelize, STRING, BOOLEAN, Model } from 'sequelize';
import { BuildOptions } from 'sequelize';
import { Todo } from '../models/store';

const sequelize = new Sequelize('tsrpcdb', 'postgres', '', {
  host: 'localhost',
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

export const findAll = TodoOrm.findAll.bind(TodoOrm);
export const create = TodoOrm.create.bind(TodoOrm);
export const update = TodoOrm.update.bind(TodoOrm);
export const destroy = TodoOrm.destroy.bind(TodoOrm);
