CREATE TABLE ars(
id SERIAL,
Wahlkreisnr VARCHAR(254),
Wahlkreisbez VARCHAR(254),
RGS_Land VARCHAR(254),
RGS_RegBez VARCHAR(254),
RGS_Kreis VARCHAR(254),
RGS_GemVerband VARCHAR(254),
RGS_Gemeinde VARCHAR(254),
Landname VARCHAR(254),
RegBezname VARCHAR(254),
Kreisname VARCHAR(254),
GemVerbandname VARCHAR(254),
Gemeindename VARCHAR(254),
Gemeindeteil VARCHAR(254),
Wahlkreisvon VARCHAR(254),
Wahlkreisbis VARCHAR(254),
ARS VARCHAR(254),
  PRIMARY KEY (id)
);


COPY ars(
Wahlkreisnr,
Wahlkreisbez,
RGS_Land,
RGS_RegBez,
RGS_Kreis,
RGS_GemVerband,
RGS_Gemeinde,
Landname,
RegBezname,
Kreisname,
GemVerbandname,
Gemeindename,
Gemeindeteil,
Wahlkreisvon,
Wahlkreisbis,
ARS)
FROM '/docker-entrypoint-initdb.d/ars.csv'
DELIMITER ';'
CSV HEADER;
