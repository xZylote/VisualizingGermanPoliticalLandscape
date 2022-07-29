# Bachelor Project

  

## Structure

  

You can find documents associated with the project in the corresponding folders 'Presentation', 'Report', and 'Teaser Poster'. Scientific papers cited in the project report can be found in 'Papers'.

  ---

The applications was implemented in three layers: 'Database', 'Backend' and 'Frontend', which correspond to the identical folders. The frontend uses the Angular-Framework, so you will find the source code in 'Frontend/angular/src'.

  
  

For the application to work, we create a database and load the necessary data which will be accessible on port 5432. Then, we execute a query whose result will be made available as a json on port 5000. Last of all, we create the visualization which is available on port 4200 and can be accessed with any web browser.

  

This process is automated using Docker. Typing the commands **docker compose build** and **docker compose up**, we can create and run the application. When finished, navigate to localhost:4200 to see the results.

  ---

The entry-point for the frontend code is *index.html*. You can then go through all the code recursively.

  
---
Versions used for testing:

	Docker 				20.10.11
	postgres 			14.1
		postgis 		14.3.1
	Node.js 			17.1.0
		npm 			8.1.4
			angular		13.0.3
			d3 			7.1.1
	Python 				3.8
		pip 			21.3.1
			psycopg2 	2.9.2
			Flask 		2.0.2
			Flask-Cors 	3.0.10
	Google Chrome 		92.0.4515.159