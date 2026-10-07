import dictionary from "./dictionary.json";
import { getDirectComponents, getLeafComponents, parseDecomposition, type DecompositionNode } from "./ids";

export type CharacterData = {
  pinyin: string[];
  definition: string;
  decomposition: string;
  etymology: {
    type?: "ideographic" | "pictographic" | "pictophonetic" | string;
    hint?: string | null;
    phonetic?: string | null;
    semantic?: string | null;
  } | null;
  radical: string | null;
};

export type CharacterInfo = CharacterData & {
  character: string;
  decompositionTree: DecompositionNode | null;
};

const data = dictionary as unknown as Record<string, CharacterData>;

export function getCharacterInfo(character: string): CharacterInfo | null {
  const value = data[character];
  if (!value) return null;
  return { character, ...value, decompositionTree: parseDecomposition(value.decomposition) };
}

export { getDirectComponents, getLeafComponents, parseDecomposition };
export type { DecompositionNode };
