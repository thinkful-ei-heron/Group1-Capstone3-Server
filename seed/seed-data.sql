begin;
truncate "users", "stats", "game_history", "game_data", "room_queue" restart identity cascade;

insert into "users" ("username", "password", "email") 
VALUES 
    ('admin1', '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG', 'someEmail@gmail.com'),
    ('admin2', '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG', 'someEmail2@gmail.com');

insert into "stats" ("userid", "wins", "losses", "draws")
values
    (1, 34, 28, 1),
    (2, 0, 0, 0);

insert into "room_queue" ("size") 
values (0);

commit; 