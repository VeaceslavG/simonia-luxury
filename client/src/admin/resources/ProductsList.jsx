import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  EditButton,
  FunctionField,
  CreateButton,
  TopToolbar,
  DeleteWithConfirmButton,
} from "react-admin";

const ListActions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
);

export default function ProductsList(props) {
  return (
    <List {...props} actions={<ListActions />}>
      <Datagrid rowClick="edit">
        <TextField source="id" />
        <TextField source="name" />
        <FunctionField
          label="Category"
          render={(record) => record.category?.name || ""}
        />
        <FunctionField
          source="price_cents"
          label="Price (MDL)"
          render={(record) => (record.price_cents / 100).toFixed(2)}
        />
        <BooleanField source="is_active" />
        <EditButton />
        <DeleteWithConfirmButton />
      </Datagrid>
    </List>
  );
}
