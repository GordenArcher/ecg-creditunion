import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

const ProfileSkeleton = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonItem = ({ width, height, style = {} }: any) => (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: "#222",
          borderRadius: 8,
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000", padding: 20 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 30,
        }}
      >
        <SkeletonItem width={100} height={30} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <SkeletonItem width={30} height={30} borderRadius={15} />
          <SkeletonItem width={30} height={30} borderRadius={15} />
        </View>
      </View>

      <View style={{ alignItems: "center", marginBottom: 30 }}>
        <SkeletonItem width={100} height={100} borderRadius={50} />
        <SkeletonItem width={150} height={20} style={{ marginTop: 12 }} />
        <SkeletonItem width={120} height={16} style={{ marginTop: 8 }} />
      </View>

      <View
        style={{
          backgroundColor: "#111",
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <SkeletonItem width={120} height={20} />
          <SkeletonItem width={40} height={20} />
        </View>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 8,
            }}
          >
            <SkeletonItem width={80} height={16} />
            <SkeletonItem width={120} height={16} />
          </View>
        ))}
      </View>

      <View
        style={{
          backgroundColor: "#111",
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <SkeletonItem width={100} height={20} style={{ marginBottom: 16 }} />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 8,
            }}
          >
            <SkeletonItem width={70} height={16} />
            <SkeletonItem width={100} height={16} />
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: "#111", borderRadius: 16, padding: 16 }}>
        <SkeletonItem width={120} height={20} style={{ marginBottom: 16 }} />
        {[1, 2].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <SkeletonItem width={20} height={20} borderRadius={10} />
              <View>
                <SkeletonItem width={100} height={16} />
                <SkeletonItem width={80} height={12} style={{ marginTop: 4 }} />
              </View>
            </View>
            <SkeletonItem width={16} height={16} />
          </View>
        ))}
      </View>
    </View>
  );
};

export default ProfileSkeleton;
