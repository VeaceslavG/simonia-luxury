import {
  List,
  Datagrid,
  TextField,
  NumberField,
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
        <NumberField source="price" />
        <BooleanField source="is_active" />
        <EditButton />
        <DeleteWithConfirmButton />
      </Datagrid>
    </List>
  );
}
