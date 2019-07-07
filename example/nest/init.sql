CREATE USER mgechev PASSWORD '1234';
CREATE DATABASE tsrpcdb;
GRANT ALL PRIVILEGES ON DATABASE tsrpcdb TO mgechev;

\connect tsrpcdb;

CREATE TABLE todos (
  id serial primary key,
  label text not null,
  completed boolean not null
);
