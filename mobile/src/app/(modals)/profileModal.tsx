import { BlobatarAvatar } from "@/components/Avatar/BlobatarAvatar";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Header } from "@/components/Header";
import { Input } from "@/components/Input";
import { ModalWrapper } from "@/components/ModalWrapper";
import { Typo } from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { scale, verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

export default function ProfileModal() {
  const { user, updateUsername } = useAuth();
  const [userName, setUserName] = useState(user?.username || "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async () => {
    const trimmedName = userName.trim();
    if (!trimmedName) {
      Alert.alert("Attention", "Veuillez renseigner un nom d'utilisateur.");
      return;
    }
    setLoading(true);
    const res = await updateUsername(trimmedName);
    setLoading(false);
    if (res.success) {
      router.back();
    } else {
      Alert.alert(
        "Erreur",
        res.msg || "Impossible de mettre à jour le profil.",
      );
    }
  };
  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title="Mettre a jour le profile"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.avatarContainer}>
            <BlobatarAvatar
              name={userName || user?.email || "expense"}
              size={verticalScale(135)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Nom</Typo>
            <Input
              placeholder="Nom"
              value={userName}
              onChangeText={setUserName}
            />
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Button onPress={onSubmit} style={{ flex: 1 }} loading={loading}>
          <Typo color={colors.neutral900} fontWeight={"700"}>
            Mettre à jour
          </Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingY._20,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral300,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.neutral500,
  },
  editIcon: {
    position: "absolute",
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  },
  inputContainer: {
    gap: spacingY._10,
  },
});
