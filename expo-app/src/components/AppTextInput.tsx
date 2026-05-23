import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { useFontScale } from "../fontScale";

export function AppTextInput({ style, ...rest }: TextInputProps) {
  const fontScale = useFontScale();
  const flattened = StyleSheet.flatten(style) ?? {};
  const baseFontSize = typeof flattened.fontSize === "number" ? flattened.fontSize : 14;
  const scaledLineHeight =
    typeof flattened.lineHeight === "number" ? flattened.lineHeight * fontScale : undefined;

  return (
    <TextInput
      {...rest}
      allowFontScaling={false}
      style={[style, { fontSize: baseFontSize * fontScale, lineHeight: scaledLineHeight }]}
    />
  );
}
