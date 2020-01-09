begin;

create table if not exists room_queue (
    id integer default 1,
    size integer default 0,
    first integer references game_history(id) default null,
    last integer references game_history(id) default null
);


commit;