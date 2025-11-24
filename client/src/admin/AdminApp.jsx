import { Admin, Resource } from "react-admin";
import dataProvider from "./dataProvider";
import authProvider from "./authProvider";

import MyLoginPage from "./resources/MyLogin";
import ProductsList from "./resources/ProductsList";
import OrdersList from "./resources/OrdersList";
import UsersList from "./resources/UsersList";
import { ProductEdit } from "./resources/ProductEdit";
import { ProductCreate } from "./resources/ProductCreate";

export default function AdminApp() {
  return (
    <Admin
      basename="/admin"
      dataProvider={dataProvider}
      authProvider={authProvider}
      loginPage={MyLoginPage}
    >
      <Resource
        name="products"
        list={ProductsList}
        edit={ProductEdit}
        create={ProductCreate}
      />
      <Resource name="orders" list={OrdersList} />
      <Resource name="users" list={UsersList} />
      <Resource name="categories" />
    </Admin>
  );
}
