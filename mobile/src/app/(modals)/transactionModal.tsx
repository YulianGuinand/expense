import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Header } from "@/components/Header";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { ModalWrapper } from "@/components/ModalWrapper";
import { Typo } from "@/components/Typo";
import {
  expenseCategories,
  incomeCategories,
  transactionTypes,
} from "@/constants/data";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { dropdownStyles } from "@/constants/dropdownStyles";
import { extractApiErrorMessage } from "@/services/api/apiClient";
import { transactionService } from "@/services/api/transactionService";
import { walletService } from "@/services/api/walletService";
import { queryKeys } from "@/services/query/queryKeys";
import { CreateTransactionInput, TransactionType, WalletType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import DateTimePicker, { DateTimePickerChangeEvent } from "@react-native-community/datetimepicker";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TrashIcon } from "phosphor-react-native";
import { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

const MAX_DESCRIPTION_LENGTH = 200;
const MAX_AMOUNT_LENGTH = 12;

export default function TransactionModal() {
  const params = useLocalSearchParams<{ id?: string }>();
  const parsedId = Number(params.id);
  const isEdit = params.id != null && Number.isFinite(parsedId);

  const { data: wallets = [], isLoading: isLoadingWallets } = useQuery({
    queryKey: queryKeys.wallets.all,
    queryFn: () => walletService.getAll(),
  });

  const { data: existing, isLoading: isLoadingTransaction } = useQuery({
    queryKey: queryKeys.transactions.detail(parsedId),
    queryFn: () => transactionService.getById(parsedId),
    enabled: isEdit,
  });

  if (isLoadingWallets || (isEdit && isLoadingTransaction)) {
    return (
      <ModalWrapper>
        <Loading />
      </ModalWrapper>
    );
  }

  return (
    <TransactionForm
      wallets={wallets}
      existing={isEdit ? existing : undefined}
      parsedId={parsedId}
      isEdit={isEdit}
    />
  );
}

type TransactionFormProps = {
  wallets: WalletType[];
  existing?: TransactionType;
  parsedId: number;
  isEdit: boolean;
};

function TransactionForm({
  wallets,
  existing,
  parsedId,
  isEdit,
}: TransactionFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const firstWalletId = wallets.find((wallet) => wallet.id != null)?.id;
  const [type, setType] = useState(existing?.type ?? "expense");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [date, setDate] = useState(
    existing ? new Date(existing.date) : new Date(),
  );
  const [description, setDescription] = useState(existing?.description ?? "");
  const [walletId, setWalletId] = useState<string | null>(
    existing
      ? String(existing.walletId)
      : firstWalletId != null
        ? String(firstWalletId)
        : null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const invalidateData = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all }),
    ]);

  const saveMutation = useMutation({
    mutationFn: async (input: CreateTransactionInput) =>
      isEdit
        ? transactionService.update(parsedId, input)
        : transactionService.create(input),
    onSuccess: async () => {
      await invalidateData();
      router.back();
    },
    onError: (error) => {
      Alert.alert(
        "Erreur",
        extractApiErrorMessage(
          error,
          "Impossible d'enregistrer la transaction.",
        ),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => transactionService.remove(parsedId),
    onSuccess: async () => {
      await invalidateData();
      router.back();
    },
    onError: (error) => {
      Alert.alert(
        "Erreur",
        extractApiErrorMessage(
          error,
          "Impossible de supprimer la transaction.",
        ),
      );
    },
  });

  const loading = saveMutation.isPending || deleteMutation.isPending;

  const categoryOptions = Object.values(
    type === "income" ? incomeCategories : expenseCategories,
  ).map((item) => ({
    label: item.label,
    value: item.value,
  }));

  const onTypeChange = (value: string) => {
    setType(value);
    const nextCategories =
      value === "income" ? incomeCategories : expenseCategories;
    if (!nextCategories[category]) {
      setCategory("");
    }
  };

  const onSubmit = () => {
    const trimmedDescription = description.trim();
    const parsedAmount = parseFloat(amount.replace(",", "."));

    if (!walletId) {
      Alert.alert("Champ requis", "Le portefeuille est requis.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Montant invalide", "Le montant doit être supérieur à 0.");
      return;
    }

    if (!category) {
      Alert.alert("Champ requis", "La catégorie est requise.");
      return;
    }

    if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      Alert.alert(
        "Description trop longue",
        `La description ne peut pas dépasser ${MAX_DESCRIPTION_LENGTH} caractères.`,
      );
      return;
    }

    saveMutation.mutate({
      type,
      amount: parsedAmount,
      category,
      date: date.toISOString(),
      description: trimmedDescription || null,
      walletId: Number(walletId),
    });
  };

  const showDeleteAlert = () => {
    Alert.alert(
      "Confirmer",
      "Êtes-vous sûr de vouloir supprimer cette transaction ?\nCette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  const onValueChange = (event: DateTimePickerChangeEvent) => {
    const timestamp = event.nativeEvent.timestamp;

    if (timestamp) {
      setDate(new Date(timestamp));
    }

    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={isEdit ? "Modifier la transaction" : "Nouvelle transaction"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Type de transaction</Typo>
            <Dropdown
              style={dropdownStyles.container}
              selectedTextStyle={dropdownStyles.selectedText}
              iconStyle={dropdownStyles.icon}
              activeColor={colors.neutral700}
              placeholder="Sélectionner un type"
              placeholderStyle={dropdownStyles.placeholder}
              data={transactionTypes}
              maxHeight={300}
              labelField="label"
              valueField="value"
              value={type}
              onChange={(item) => onTypeChange(item.value)}
              itemTextStyle={dropdownStyles.itemText}
              itemContainerStyle={dropdownStyles.itemContainer}
              containerStyle={dropdownStyles.listContainer}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Montant</Typo>
            <Input
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              maxLength={MAX_AMOUNT_LENGTH}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Portefeuille</Typo>
            <Dropdown
              style={dropdownStyles.container}
              selectedTextStyle={dropdownStyles.selectedText}
              iconStyle={dropdownStyles.icon}
              activeColor={colors.neutral700}
              placeholder="Sélectionner un portefeuille"
              placeholderStyle={dropdownStyles.placeholder}
              data={wallets
                .filter((wallet) => wallet.id != null)
                .map((wallet) => ({
                  label: `${wallet.name} (${(wallet.amount ?? 0).toFixed(2)}€)`,
                  value: String(wallet.id),
                }))}
              maxHeight={300}
              labelField="label"
              valueField="value"
              value={walletId}
              onChange={(item) => setWalletId(item.value)}
              itemTextStyle={dropdownStyles.itemText}
              itemContainerStyle={dropdownStyles.itemContainer}
              containerStyle={dropdownStyles.listContainer}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Catégorie</Typo>
            <Dropdown
              style={dropdownStyles.container}
              selectedTextStyle={dropdownStyles.selectedText}
              iconStyle={dropdownStyles.icon}
              activeColor={colors.neutral700}
              placeholder="Sélectionner une catégorie"
              placeholderStyle={dropdownStyles.placeholder}
              data={categoryOptions}
              maxHeight={300}
              labelField="label"
              valueField="value"
              value={category}
              onChange={(item) => setCategory(item.value)}
              itemTextStyle={dropdownStyles.itemText}
              itemContainerStyle={dropdownStyles.itemContainer}
              containerStyle={dropdownStyles.listContainer}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Date</Typo>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Typo size={14} color={colors.white}>
                {date.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Typo>
            </TouchableOpacity>

            {showDatePicker && (
              <View>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onValueChange={onValueChange}
                  maximumDate={new Date()}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Typo size={14} color={colors.primary} fontWeight={"600"}>
                      Terminé
                    </Typo>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Description</Typo>
            <Input
              placeholder="Description (optionnel)"
              value={description}
              onChangeText={setDescription}
              maxLength={MAX_DESCRIPTION_LENGTH}
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
              {isEdit ? "Modifier" : "Ajouter"} la transaction
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
    gap: spacingY._20,
    paddingVertical: spacingY._15,
    paddingBottom: spacingY._40,
  },
  inputContainer: {
    gap: spacingY._10,
  },
  dateInput: {
    flexDirection: "row",
    height: verticalScale(54),
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
  },
  datePickerButton: {
    backgroundColor: colors.neutral700,
    alignSelf: "flex-end",
    padding: spacingY._7,
    marginRight: spacingX._7,
    paddingHorizontal: spacingY._7,
    borderRadius: radius._10,
  },
});
