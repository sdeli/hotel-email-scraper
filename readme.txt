APP NAME: HOTEL EMAIL SCRAPER

Creator: Sandor Deli
Location: Ireland, Galway
Tel: 0838335144
email: bgfkszmsdeli@gmail.com
git: https://github.com/sdeli
linkedIn: https://www.linkedin.com/in/sandor-deli-11b798101/

Technoliges used in the projekt:
backend: node.js
database: mysql
headless browser: puppeteer
mentionable npm libraries: request-promise, free-memory, cheerio, json2csv, nodemailer

PURPOSE OF THE PROJEKT
    * The hotel emain scraper is a webscraper/search-engine which finds the names, websites, adresses and most importantly emails of hotels
    * The emails are utilized then in an other business.
    * For the proper functioning it needs its configuration file which is not uploaded to github because the customer who ordered it doesnt want, that others gets use of it, but he agreed that the producer uses it as a reference for further clients and employers

BRIEF SUMMARY OF THE ARCHITECTURE
    The architecture of the software is heavily based on some design patterns, design methods and programming techiques:
        - Top Down Anlysis - separation of concerns
        - modularization - based on chapter 4 https://github.com/agelessman/MyBooks/blob/master/programming-javascript-applications-eric-elliott(www.ebook-dl.com).pdf
        - Dependency Inversion principle from S.O.L.I.D.
        - Biger objects are Composed from "traits"
        - revealing modular pattern
        - squential execution with promises
        - mvc
            models: app/models
            controllers: app/controllers
            no views
        - pure functions
        - Single responsibility functions
        - function curries

    * The application starts on executing the app/app.js file. This file creates the environment for the application to run.
    * The actual scraping is managed by the controllers in the app/controllers folder which are triggered by the app.js file. Right now there is one scrape process which is managed by the app/controllers/hotels-scraper.js file.
    * The controllers are managing the logic of the scrape process and in the controllers widgets (libraries) are called to do the current task.
    * Controllers are trying not to do anything below there level

    * The application is composed of:
         1. Controllers (right now just one) which are managing the execuiton (but not doing it) of the main task
         2. Widgets which are called by the controllers to execute the current sub task
         3. Models which are providing database access for the widgets, if need.

    * The Configuration
        * I distinguish 2 kinds of variables
            1. characteristic to the current call => these are the ones which are as parameters passed to the function/method/function constructor
            2. characteristic to the current state of the application
                - like
                    - selectors on a website which are not changing by each run
                    - error messages
                    - email adresses
                    - api keys
                - these information are stored in the configuration file
        * Configuration resides in app/config/assets/config.json (this file is not public). All Information which characteristic to the current state of the application is stored in the config.json
        * The config file is not public due to the reasons mentioned above

    * widgets
        * 'widget' is name for top level modules which are called by the controller to carry out some controller level task or called in other widgets.
        * widgets are all modularized based on chapter 4 of: https://github.com/agelessman/MyBooks/blob/master/programming-javascript-applications-eric-elliott(www.ebook-dl.com).pdf
        * widgets are designed with top down analyzis
            - The main task/module is broken down into subtasks until the subtask can not be broken down to further functions
            - All widgets are getting all the configuration what they need in the top of there main file (which is referenced in there package.json). These configuration constants are getting hoisted when the application runs up, before the widget could be called by any of the controllers. Then they pass the needed configuration down to there submodules on demand. I made this principle to achive encapsulation and clean interface. Furthermore if all the configuration is passed into module at one place, then it easier to determine what configuration that widget needs to function properly and you dont miss out something.
    
    * Path Managment
        * I created a function called modules-linker (in app/widgets/scraper-utils)
        * It links a target-folder into the node_modules folder
        * as a result (if there is a package.json file in the target-folder, which package.json in the main filed references a file in the target folder) then the target-folders excutable can be called all over the application (no matter how deep you are in the folder tree) as require('target-folders-name');
        * This happens to all entities of the application which are often referenced by other parts widgets or controllers.
            * Entites linked into node_modules
                1. widgets
                2. models
                3. configuration
        