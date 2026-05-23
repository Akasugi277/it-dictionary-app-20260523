import { StyleSheet, Text, TextProps } from "react-native";
import { useFontScale } from "../fontScale";

export function AppText({ style, ...rest }: TextProps) {
  const fontScale = useFontScale();
  const flattened = StyleSheet.flatten(style) ?? {};
  const baseFontSize = typeof flattened.fontSize === "number" ? flattened.fontSize : 14;
  const scaledLineHeight =
    typeof flattened.lineHeight === "number" ? flattened.lineHeight * fontScale : undefined;

  return (
    <Text
      {...rest}
      allowFontScaling={false}
      style={[style, { fontSize: baseFontSize * fontScale, lineHeight: scaledLineHeight }]}
    />
  );
}
