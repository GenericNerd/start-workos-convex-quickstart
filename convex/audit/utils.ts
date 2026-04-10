import { Infer, PropertyValidators, v, Validator } from "convex/values"

type LinkedType<T extends PropertyValidators> = UnionToIntersection<
  {
    [K in keyof T]:
      | { before: { [P in K]: Infer<T[P]> }; after: { [P in K]: Infer<T[P]> } }
      | { before: { [P in K]?: never }; after: { [P in K]: Infer<T[P]> } }
      | { before: { [P in K]?: never }; after: { [P in K]?: never } }
  }[keyof T]
>

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

export function changeValidator<T extends PropertyValidators>(
  mapping: T
): Validator<LinkedType<T>> {
  const keys = Object.keys(mapping)

  function getPermutations(remainingKeys: string[]): any[] {
    if (remainingKeys.length === 0) {
      return [{ before: {}, after: {} }]
    }

    const [first, ...rest] = remainingKeys
    const validator = mapping[first]
    const subPerms = getPermutations(rest)

    return subPerms.flatMap((perm) => [
      {
        before: { ...perm.before, [first]: validator },
        after: { ...perm.after, [first]: validator },
      },
      {
        before: { ...perm.before },
        after: { ...perm.after, [first]: validator },
      },
      {
        before: { ...perm.before },
        after: { ...perm.after },
      },
    ])
  }

  const permutations = getPermutations(keys).map((p) =>
    v.object({
      before: v.object(p.before),
      after: v.object(p.after),
    })
  )

  return v.union(...permutations) as any
}
