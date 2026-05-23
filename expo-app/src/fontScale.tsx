import { ReactNode, createContext, useContext } from "react";

const FontScaleContext = createContext(1);

export function FontScaleProvider({
  value,
  children,
}: {
  value: number;
  children: ReactNode;
}) {
  return <FontScaleContext.Provider value={value}>{children}</FontScaleContext.Provider>;
}

export function useFontScale() {
  return useContext(FontScaleContext);
}
