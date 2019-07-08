import { Sequelize, STRING, BOOLEAN, Model } from 'sequelize';
import { Todo } from '../client/src/app/models/todo';
import { BuildOptions } from 'sequelize';

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
type TodoModelStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): TodoModel;
};

export const TodoOrm = <TodoModelStatic>sequelize.define('todos', {
  label: STRING,
  completed: BOOLEAN
});
