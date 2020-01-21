begin;

create table if not exists room_queue (
    id integer default 1,
    size smallint default 0,
    first integer references game_history(id) default null,
    last integer references game_history(id) default null
);

insert into "room_queue" ("size") 
    values (0);
    
commit;