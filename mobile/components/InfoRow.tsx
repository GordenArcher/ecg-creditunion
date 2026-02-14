import { Text, View } from "react-native";

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
    }}
  >
    <Text style={{ color: "#888", fontSize: 14 }}>{label}</Text>
    <Text style={{ color: "#fff", fontSize: 14, flex: 1, textAlign: "right" }}>
      {value}
    </Text>
  </View>
);

export default InfoRow;
