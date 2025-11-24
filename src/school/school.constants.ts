export const SCHOOL_ERRORS = {
  NAME_REQUIRED: 'School name is required',
  CITY_REQUIRED: 'City is required',
  DUPLICATE_SCHOOL: (name: string, city: string) =>
    `School with name "${name}" already exists in city "${city}"`,
  FAILED_TO_CREATE: 'Failed to create school',
  SCHOOL_NOT_FOUND: 'School not found',
};

export const SCHOOL_MESSAGES = {
  CREATED: 'School created successfully',
};
