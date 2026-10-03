import { BlobatarAvatar } from "@/components/Avatar/BlobatarAvatar";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Header } from "@/components/Header";
import { Input } from "@/components/Input";
import { ModalWrapper } from "@/components/ModalWrapper";
import { Typo } from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { extractApiErrorMessage } from "@/services/api/apiClient";
import { walletService } from "@/services/api/walletService";
import { queryKeys } from "@/services/query/queryKeys";
import { scale, verticalScale } from "@/utils/styling";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TrashIcon } from "phosphor-react-native";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

const MAX_NAME_LENGTH = 100;

export default function WalletModal() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    goal?: string;
  }>();

  const parsedId = Number(params.id);
  const isEdit = params.id != null && Number.isFinite(parsedId);

  const [name, setName] = useState(params?.name || "");
  const [goal, setGoal] = useState(params?.goal || "");
  const router = useRouter();
  const queryClient = useQueryClient();

  const invalidateWallets = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });

  const saveMutation = useMutation({
    mutationFn: async (payload: { name: string; goal: number | null }) =>
      isEdit
        ? walletService.update(parsedId, payload)
        : walletService.create(payload),
    onSuccess: async () => {
      await invalidateWallets();
      router.back();
    },
    onError: (error) => {
      Alert.alert(
        "Erreur",
        extractApiErrorMessage(
          error,
          "Impossible d'enregistrer le portefeuille.",
        ),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => walletService.remove(parsedId),
    onSuccess: async () => {
      await invalidateWallets();
      router.back();
    },
    onError: (error) => {
      Alert.alert(
        "Erreur",
        extractApiErrorMessage(
          error,
          "Impossible de supprimer le portefeuille.",
        ),
      );
    },
  });

  const loading = saveMutation.isPending || deleteMutation.isPending;

  const onSubmit = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert("Champ requis", "Le nom du portefeuille est requis.");
      return;
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      Alert.alert(
        "Nom trop long",
        `Le nom du portefeuille ne peut pas dépasser ${MAX_NAME_LENGTH} caractères.`,
      );
      return;
    }

    const trimmedGoal = goal.trim();
    let goalValue: number | null = null;
    if (trimmedGoal) {
      const parsedGoal = parseFloat(trimmedGoal.replace(",", "."));
      if (!Number.isFinite(parsedGoal) || parsedGoal <= 0) {
        Alert.alert(
          "Objectif invalide",
          "L'objectif doit être supérieur à 0.",
        );
        return;
      }
      goalValue = parsedGoal;
    }

    saveMutation.mutate({ name: trimmedName, goal: goalValue });
  };

  const onDelete = () => {
    if (!isEdit) return;
    deleteMutation.mutate();
  };

  const showDeleteAlert = () => {
    Alert.alert(
      "Confirmer",
      "Êtes vous sur de vouloir supprimer ce portefeuile?\nCette action supprimera toutes les transactions liées.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: onDelete },
      ],
    );
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={isEdit ? "Modifier le portefeuille" : "Nouveau portefeuille"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.avatarContainer}>
            <BlobatarAvatar name={name} size={verticalScale(135)} />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Nom du portefeuille</Typo>
            <Input
              placeholder="Nom du portefeuille"
              value={name}
              onChangeText={setName}
              maxLength={MAX_NAME_LENGTH}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Objectif (optionnel)</Typo>
            <Input
              placeholder="Ex : 1000"
              value={goal}
              onChangeText={setGoal}
              keyboardType="decimal-pad"
            />
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {isEdit && !loading && (
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
              {isEdit ? "Modifier" : "Ajouter"} le portefeuille
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
