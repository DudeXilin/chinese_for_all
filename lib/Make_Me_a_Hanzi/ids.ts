export type DecompositionNode =
  | { type: "character"; char: string }
  | { type: "operator"; operator: string; children: DecompositionNode[] };

const ARITY: Record<string, 1 | 2 | 3> = {
  "⿰": 2, "⿱": 2, "⿴": 2, "⿵": 2, "⿶": 2, "⿷": 2,
  "⿸": 2, "⿹": 2, "⿺": 2, "⿻": 2, "⿼": 2, "⿽": 2,
  "⿲": 3, "⿳": 3,
  "⿾": 1, "⿿": 1,
  "㇯": 2,
};

export function parseDecomposition(input: string): DecompositionNode | null {
  if (!input || input === "？") return null;
  const chars = Array.from(input);
  let index = 0;

  const parseNode = (): DecompositionNode | null => {
    const token = chars[index++];
    if (!token) return null;

    const arity = ARITY[token];
    if (!arity) return { type: "character", char: token };

    const children: DecompositionNode[] = [];
    for (let i = 0; i < arity; i += 1) {
      const child = parseNode();
      if (!child) return null;
      children.push(child);
    }

    return { type: "operator", operator: token, children };
  };

  const result = parseNode();
  return index === chars.length ? result : null;
}

export function getDirectComponents(input: string): string[] {
  const tree = parseDecomposition(input);
  if (!tree) return [];
  if (tree.type === "character") return [tree.char];
  return tree.children.flatMap((child) =>
    child.type === "character" ? [child.char] : getLeafCharacters(child),
  );
}

function getLeafCharacters(node: DecompositionNode): string[] {
  return node.type === "character"
    ? [node.char]
    : node.children.flatMap(getLeafCharacters);
}

export function getLeafComponents(input: string): string[] {
  const tree = parseDecomposition(input);
  return tree ? getLeafCharacters(tree) : [];
}
