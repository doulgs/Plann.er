import { View, Text, ActivityIndicator } from "react-native";

export default function Loading() {
  return (
    <ActivityIndicator
      className="flex-1 bg-zinc-950 items-center justify-center text-lime-300"
      size={42}
    />
  );
}
