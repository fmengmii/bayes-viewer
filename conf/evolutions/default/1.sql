# --- Created by Ebean DDL
# To stop Ebean DDL generation, remove this comment and start using Evolutions

# --- !Ups

create table network_file (
  id                        bigint auto_increment not null,
  user_id                   bigint,
  file_name                 varchar(255),
  file_type                 varchar(255),
  file_content              TEXT,
  is_public                 tinyint(1) default 0,
  update_time               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  constraint uq_network_file_1 unique (user_id,file_type,file_name),
  constraint pk_network_file primary key (id))
;

create table raw_data_file (
  id                        bigint auto_increment not null,
  network_file_id           bigint,
  file_name                 varchar(255),
  file_type                 varchar(255),
  file_content              TEXT,
  is_public                 tinyint(1) default 0,
  update_time               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  constraint pk_raw_data_file primary key (id))
;

create table user (
  id                        bigint auto_increment not null,
  user_name                 varchar(255),
  password                  varchar(255),
  email                     varchar(255),
  first_name                varchar(255),
  last_name                 varchar(255),
  title                     varchar(255),
  organization              varchar(255),
  is_approved               tinyint(1) default 0,
  update_time               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  constraint uq_user_user_name unique (user_name),
  constraint uq_user_email unique (email),
  constraint pk_user primary key (id))
;

alter table network_file add constraint fk_network_file_user_1 foreign key (user_id) references user (id) on delete restrict on update restrict;
create index ix_network_file_user_1 on network_file (user_id);
alter table raw_data_file add constraint fk_raw_data_file_networkFile_2 foreign key (network_file_id) references network_file (id) on delete restrict on update restrict;
create index ix_raw_data_file_networkFile_2 on raw_data_file (network_file_id);



# --- !Downs

SET FOREIGN_KEY_CHECKS=0;

drop table network_file;

drop table raw_data_file;

drop table user;

SET FOREIGN_KEY_CHECKS=1;

