export default async function gennullthrows<T>(
  gen: Promise<T | null | undefined>,
): Promise<T> {
  const val = await gen;
  if (val === null || val === undefined) {
    throw Error('Unexpected null or undefined value');
  }
  return val;
}
