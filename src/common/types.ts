export type UpdateParams<T> = { -readonly [k in keyof Partial<T>]: T[k] };
