type RevertT<T extends Record<PropertyKey, PropertyKey>> = {
  [K in keyof T as T[K]]: K
};

export const getKey = <T extends Record<PropertyKey, PropertyKey>, V extends T[keyof T]>
  (EnumType: T, value: V) => Object.keys(EnumType).find(key => EnumType[key] === value) as RevertT<T>[V];
