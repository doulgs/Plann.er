import { Text, View } from "react-native";

type Props = {
  tripId: string;
};

export function Details({ tripId }: Props) {
  return (
    <View className="flex-1">
      <Text className="text-white">Details {tripId}</Text>
    </View>
  );
}
