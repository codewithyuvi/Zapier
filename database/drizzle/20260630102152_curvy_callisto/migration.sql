CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL UNIQUE
);
