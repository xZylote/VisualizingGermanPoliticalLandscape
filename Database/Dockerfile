# specify base image that we want to extend
FROM postgis/postgis:14-3.1

# set environment variables that we want to change
ENV POSTGRES_DB="gis_db_2"
ENV POSTGRES_USER="gis_user"
ENV POSTGRES_PASSWORD="gis_pass"

# install osm2pgsql
RUN apt update
RUN apt install -y osm2pgsql curl

# create a file to activate the hstore extension
RUN echo 'CREATE EXTENSION IF NOT EXISTS "hstore";' > /docker-entrypoint-initdb.d/activate-hstore.sql

# copy startup scripts and data into initialization folder
COPY *.sql /docker-entrypoint-initdb.d/
COPY *.csv /docker-entrypoint-initdb.d/