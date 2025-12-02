import {
  List,
  Datagrid,
  TextField,
  NumberField,
  EditButton,
  FunctionField,
  DeleteButton,
} from "react-admin";

export default function OrdersList(props) {
  return (
    <List {...props}>
      <Datagrid rowClick="edit">
        <TextField source="id" />
        <FunctionField
          label="Customer"
          render={(record) => record.user?.name || record.name}
        />
        <TextField source="phone" />
        <TextField source="email" />
        <TextField source="address" />
        <TextField source="city" />
        <TextField source="notes" />
        <NumberField source="total" />
        <TextField source="status" />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
}
