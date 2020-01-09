begin;
truncate "users", "stats", "game_history", "game_data" restart identity cascade;

insert into "users" ("username", "password", "email") 
VALUES 
    ('admin1', 'pass', 'someEmail@gmail.com'),
    ('admin2', 'pass', 'someEmail2@gmail.com');

insert into "stats" ("userid", "wins", "losses", "draws")
values
    (1, 34, 28, 1),
    (2, 0, 0, 0);


commit; 