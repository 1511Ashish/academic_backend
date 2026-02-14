export const baseSchemaFields = {
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
};

export function applyBaseSchema(schema) {
  if (!schema.path('tenantId')) {
    schema.add(baseSchemaFields);
  }
  schema.set('timestamps', true);
  schema.set('versionKey', false);
}
