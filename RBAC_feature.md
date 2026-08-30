Do the following changes to develop role based access for this product.Follow the modular and sepearation of concerns architecture which is already there.

1) A new page for all the subusers - this will give the list of already existing users. Provide a button to delete and add new user here. always fetch all the users, this will include admin user. Admin user should never be deleted.

2) Develop a configuration page in which admin role user should be able to create sub users which should only access the product and cart pages.

3) Only admin user should see the configuration settings in which he can create new sub users, he can upload the product list file to update the inventory.

4) db already have users list with role, use that table.

5) If a path is tried to be accessed by non admin user then we should show an error message that user is not authorized to perform this operation.

6) create unit test after the development.

7) create e2e automation for this.


