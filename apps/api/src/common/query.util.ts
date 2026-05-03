import { Types } from 'mongoose';

export function buildFlexibleIdQuery(id: string, field: string) {
  if (Types.ObjectId.isValid(id)) {
    return {
      $or: [{ _id: new Types.ObjectId(id) }, { [field]: id }],
    };
  }

  return { [field]: id };
}

export function generateIdentifier(prefix: string) {
  const suffix = Date.now().toString(36).toUpperCase();
  return `${prefix}-${suffix}`;
}
