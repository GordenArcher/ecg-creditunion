import Loader from "@/components/loader/loader";
import { useAuthStore } from "@/stores/useAuthStore";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

export default function AppLayout() {
  const router = useRouter();

  const { user, loading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading]);

  if (loading || !user) {
    return <Loader />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
