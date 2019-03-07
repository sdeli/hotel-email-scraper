drop database if exists hotel_data_db;
create database hotel_data_db
CHARACTER SET latin1 COLLATE latin1_german1_ci;

use hotel_data_db;

# ==== CREATE TABLES ====
drop table if exists hotels;
create table hotels (
	hotel_id char(18),
	hotel_name varchar(100) not null unique,
    avatar_shortened_link char(20) default null,
    batch_id char(19) not null,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    primary key (hotel_id)
);

drop table if exists hotel_addr;
create table hotel_addr (
	hotel_id char(18),
    country varchar(15),
    region varchar(52),
    full_addr varchar(150)
);

drop table if exists hotel_webistes;
create table hotel_webistes (
	website_id int auto_increment,
	website_url VARCHAR(512) not null unique,
    batch_id char(19) not null,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    primary key (website_id)
);

drop table if exists emails;
create table emails (
	email_id int auto_increment,
	email varchar(52) not null,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    batch_id char(19) not null,
    primary key (email_id)
);

# intermedier tables
drop table if exists websites_of_hotels;
create table websites_of_hotels (
	# id int auto_increment primary key,
	hotel_id char(18),
    website_id int
);

drop table if exists emails_of_websites;
create table emails_of_websites (
	# id int auto_increment primary key,
	website_id int,
    email_id int
);

# ==== ADDING FOREIGN KEYS ====
alter table hotel_addr
add constraint fk_hotel_id_in_hotel_addr
foreign key (hotel_id)
references hotels(hotel_id) 
on delete cascade;

alter table websites_of_hotels
add constraint fk_hotel_id_in_websites_of_hotels
foreign key (hotel_id)
references hotels(hotel_id) 
on delete cascade;

alter table websites_of_hotels
add constraint fk_website_id_in_websites_of_hotels
foreign key (website_id)
references hotel_webistes(website_id) 
on delete cascade;

alter table emails_of_websites
add constraint fk_website_id_in_emails_of_websites
foreign key (website_id)
references hotel_webistes(website_id) 
on delete cascade;

alter table emails_of_websites
add constraint fk_email_id_in_emails_of_websites
foreign key (email_id) 
references emails(email_id) 
on delete cascade;

# ==== ADDING ADDITIONAL INDEXES ====