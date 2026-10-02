import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Header } from "@/components/Header";
import { Input } from "@/components/Input";
import { ModalWrapper } from "@/components/ModalWrapper";
import { Typo } from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { WalletType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TrashIcon } from "phosphor-react-native";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

export default function WalletModal() {
  const oldWallet = useLocalSearchParams<{
    name?: string;
    image?: string;
  }>();

  const [wallet, setWallet] = useState<WalletType>({
    name: oldWallet.name || "",
    image: oldWallet.image || "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async () => {
    if (!wallet.name) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.back();
    }, 1500);
  };

  const showDeleteAlert = () => {
    Alert.alert(
      "Confirmer",
      "Êtes vous sur de vouloir supprimer ce portefeuile?\nCette action supprimera toutes les transactions liées.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              router.back();
            }, 1500);
          },
        },
      ],
    );
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={
            oldWallet.name ? "Modifier le portefeuille" : "Nouveau portefeuille"
          }
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Nom du portefeuille</Typo>
            <Input
              placeholder="Nom du portefeuille"
              value={wallet.name}
              onChangeText={(value) => setWallet({ ...wallet, name: value })}
            />
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {oldWallet.name && !loading && (
          <Button
            onPress={showDeleteAlert}
            style={{
              backgroundColor: colors.rose,
              paddingHorizontal: spacingX._15,
            }}
          >
            <TrashIcon
              color={colors.white}
              size={verticalScale(24)}
              weight="bold"
            />
          </Button>
        )}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Button onPress={onSubmit} style={{ flex: 1 }} loading={loading}>
            <Typo color={colors.neutral900} fontWeight={"700"}>
              {oldWallet.name ? "Modifier" : "Ajouter"} le portefeuille
            </Typo>
          </Button>
        </View>
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
