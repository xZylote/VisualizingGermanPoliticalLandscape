from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def wahlkreise():
    query = """

    SELECT json_build_object(
    'type', 'FeatureCollection',
    'crs',  json_build_object(
        'type',      'name', 
        'properties', json_build_object(
            'name', 'EPSG:4326'  
        )
    ),
    'features', json_agg(
        json_build_object(
            'type',       'Feature',
            'id',         gid,
            'geometry',   ST_AsGeoJSON(geom)::json,
            'properties', json_build_object(
                'wkr_nr', strukturdaten.wkr_nr,
                'name', constituencies.wkr_name,
                'bundesland', constituencies.land_name,
                'population', strukturdaten.pop,
                'income', strukturdaten.income,
                'migration', strukturdaten.pop_change_migration,
                'age_18', strukturdaten.age_18,
                'age_24', strukturdaten.age_24,
                'age_34', strukturdaten.age_34,
                'age_59', strukturdaten.age_59,
                'age_74', strukturdaten.age_74,
                'age_99', strukturdaten.age_99,
                'living_area_per_home', strukturdaten.living_area_per_home,
                'living_area_per_person', strukturdaten.living_area_per_person,
                'cars', strukturdaten.cars,
                'electric_cars', strukturdaten.electric_cars,
                'professional_school', strukturdaten.professional_school,
                'school', strukturdaten.school,
                'primary_school', strukturdaten.primary_school,
                'secondary_school', strukturdaten.secondary_school,
                'middle_school', strukturdaten.middle_school,
                'high_school', strukturdaten.high_school,
                'area', strukturdaten.area,
                'Union',COALESCE(CAST(wahldaten.Christlich_Demokratische_Union_2_eg AS numeric),0) + COALESCE(CAST(wahldaten.Christlich_Soziale_Union_2_eg AS numeric),0),
                'CDU', wahldaten.Christlich_Demokratische_Union_2_eg,
                'SPD', wahldaten.Sozialdemokratische_Partei_2_eg,
                'Linke', wahldaten.DIE_LINKE_2_eg,
                'Grüne', wahldaten.BÜNDNIS_90_DIE_GRÜNEN_2_eg,
                'CSU', wahldaten.Christlich_Soziale_Union_2_eg,
                'FDP', wahldaten.Freie_Demokratische_Partei_2_eg,
                'AFD', wahldaten.Alternative_für_Deutschland_2_eg,
                'votes', wahldaten.Gültige_2_eg
            )
        )
    )
)

FROM constituencies
INNER JOIN strukturdaten ON constituencies.wkr_nr=strukturdaten.wkr_nr
INNER JOIN wahldaten ON wahldaten.Nr=strukturdaten.wkr_nr
INNER JOIN wahldaten21 ON wahldaten.Nr = wahldaten21.Nr;"""

    with psycopg2.connect(
        host="database",
        port=5432,
        dbname="gis_db_2",
        user="gis_user",
        password="gis_pass",
    ) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            cursor.execute(query)
            results = cursor.fetchall()
    return jsonify(results), 200
