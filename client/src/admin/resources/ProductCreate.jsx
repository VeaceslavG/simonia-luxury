import {
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  ReferenceInput,
  SelectInput,
  required,
  minValue,
  ImageInput,
  ImageField,
} from "react-admin";

export const ProductCreate = (props) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="name" fullWidth validate={[required()]} />
      <TextInput source="description" multiline fullWidth />
      <NumberInput
        source="price"
        label="Price (MDL)"
        validate={[required(), minValue(0.01)]}
        min={0.01}
        step={0.01}
      />

      <ReferenceInput source="category_id" reference="categories">
        <SelectInput
          optionText="name"
          label="Category"
          validate={[required()]}
        />
      </ReferenceInput>

      <TextInput source="dimensions" />
      <ImageInput
        source="image_urls"
        label="Product image"
        multiple
        accept="image/*"
      >
        <ImageField source="src" title="title" />
      </ImageInput>
      <TextInput source="delivery_time" />
      <BooleanInput
        source="is_available"
        label="Available"
        defaultValue={true}
      />
      <BooleanInput source="is_active" label="Active" defaultValue={true} />
    </SimpleForm>
  </Create>
);
