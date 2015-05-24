drop table if exists notes;
drop table if exists codes;
create table notes (
  id integer primary key autoincrement,
  location text not null,
  symbol text not null,
  note text not null
);

create table codes (
  id integer primary key autoincrement,
  path text not null,
  htmlsource text not null
);
