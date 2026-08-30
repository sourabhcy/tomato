Read the project folder structure, do not go deep and based on config files generate a file to intialize all the variable for staging setup.

1) The variables will belong to pqsql db, new relic ids
2) we will not be pushing staging changes to any cloud setup, so the changes should be running in local setup but almost everything same as production. We will be using jenkins for triggering the staging branch pipeline to deploy.
3) Apart from jenkins for staging, the setup should be able to deploy by writing command directly from terminal as well.
4) If you need any information ask me , donot make any assumption.