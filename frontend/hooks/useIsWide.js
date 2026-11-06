import { useWindowDimensions } from "react-native";

export default function useIsWide(breakpoint = 900) {
  const { width } = useWindowDimensions();
  return width >= breakpoint;
}
