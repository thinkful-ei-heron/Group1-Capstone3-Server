begin;
truncate "users", "stats", "game_history", "game_data", "room_queue" restart identity cascade;

insert into "users" ("username", "password") 
VALUES 
    ('admin1', '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG'),
    ('admin2', '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG');

insert into "stats" ("userid", "wins", "losses")
values
    (1, 34, 28),
    (2, 0, 0);

insert into "room_queue" ("size") 
values (0);

commit; 