import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  EmailField,
  DateField,
} from "react-admin";

export default function UsersList(props) {
  return (
    <List {...props}>
      <Datagrid rowClick="edit">
        <TextField source="id" />
        <TextField source="name" />
        <EmailField source="email" />
        <TextField source="phone" />
        <BooleanField source="is_verified" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}
