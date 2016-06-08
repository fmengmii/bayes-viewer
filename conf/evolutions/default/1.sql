# --- Created by Ebean DDL
# To stop Ebean DDL generation, remove this comment and start using Evolutions

# --- !Ups

create table log (
  id                        bigint auto_increment not null,
  network_file_id           bigint,
  user_id                   bigint,
  public_user_IP            varchar(255),
  operation                 varchar(255),
  update_time               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  constraint pk_log primary key (id))
;

create table network_file (
  id                        bigint auto_increment not null,
  user_id                   bigint,
  file_name                 varchar(255),
  file_type                 varchar(255),
  file_content              LONGTEXT,
  is_public                 tinyint(1) default 0,
  update_time               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  constraint uq_network_file_1 unique (file_type,file_name),
  constraint pk_network_file primary key (id))
;

create table raw_data_file (
  id                        bigint auto_increment not null,
  network_file_id           bigint,
  file_name                 varchar(255),
  file_type                 varchar(255),
  file_content              TEXT,
  is_public                 tinyint(1) default 0,
  update_time               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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


create table model_shared_users (
  network_file_id                bigint not null,
  user_id                        bigint not null,
  constraint pk_model_shared_users primary key (network_file_id, user_id))
;

create table raw_data_shared_users (
  raw_data_file_id               bigint not null,
  user_id                        bigint not null,
  constraint pk_raw_data_shared_users primary key (raw_data_file_id, user_id))
;
alter table log add constraint fk_log_networkFile_1 foreign key (network_file_id) references network_file (id) on delete restrict on update restrict;
create index ix_log_networkFile_1 on log (network_file_id);
alter table log add constraint fk_log_user_2 foreign key (user_id) references user (id) on delete restrict on update restrict;
create index ix_log_user_2 on log (user_id);
alter table network_file add constraint fk_network_file_user_3 foreign key (user_id) references user (id) on delete restrict on update restrict;
create index ix_network_file_user_3 on network_file (user_id);
alter table raw_data_file add constraint fk_raw_data_file_networkFile_4 foreign key (network_file_id) references network_file (id) on delete restrict on update restrict;
create index ix_raw_data_file_networkFile_4 on raw_data_file (network_file_id);



alter table model_shared_users add constraint fk_model_shared_users_network_file_01 foreign key (network_file_id) references network_file (id) on delete restrict on update restrict;

alter table model_shared_users add constraint fk_model_shared_users_user_02 foreign key (user_id) references user (id) on delete restrict on update restrict;

alter table raw_data_shared_users add constraint fk_raw_data_shared_users_raw_data_file_01 foreign key (raw_data_file_id) references raw_data_file (id) on delete restrict on update restrict;

alter table raw_data_shared_users add constraint fk_raw_data_shared_users_user_02 foreign key (user_id) references user (id) on delete restrict on update restrict;

# --- !Downs

SET FOREIGN_KEY_CHECKS=0;

drop table log;

drop table network_file;

drop table model_shared_users;

drop table raw_data_file;

drop table raw_data_shared_users;

drop table user;

SET FOREIGN_KEY_CHECKS=1;

