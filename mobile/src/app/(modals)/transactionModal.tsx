import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Header } from "@/components/Header";
import { ModalWrapper } from "@/components/ModalWrapper";
import { Typo } from "@/components/Typo";
import {
  expenseCategories,
  transactionTypes,
  walletsItem,
} from "@/constants/data";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { TransactionType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TrashIcon } from "phosphor-react-native";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export default function TransactionModal() {
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);

  const oldTransaction = useLocalSearchParams<{
    name?: string;
    image?: string;
  }>();

  const [transaction, setTransaction] = useState<TransactionType>({
    type: "expense",
    amount: 0,
    description: "",
    category: "",
    date: new Date(),
    walletId: "",
    image: null,
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async () => {
    if (!transaction.category) return;
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
            oldTransaction.name
              ? "Modifier la transaction"
              : "Nouvelle transaction"
          }
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
              style={styles.dropdownContainer}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              activeColor={colors.neutral700}
              placeholder="Selectionner un type"
              placeholderStyle={styles.dropdownPlaceholder}
              data={transactionTypes}
              maxHeight={300}
              labelField="label"
              valueField="value"
              value={transaction.type}
              onChange={(item) => {
                setTransaction({ ...transaction, type: item.value });
              }}
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Portefeuille</Typo>
            <Dropdown
              style={styles.dropdownContainer}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              activeColor={colors.neutral700}
              placeholder="Selectionner un portefeuille"
              placeholderStyle={styles.dropdownPlaceholder}
              data={walletsItem.map((i) => {
                return {
                  label: `${i.name} (${i.amount.toFixed(2)}€)`,
                  value: i.name,
                };
              })}
              maxHeight={300}
              labelField="label"
              valueField="value"
              value={walletsItem[0].name}
              onChange={(item) => {
                setTransaction({ ...transaction, walletId: item.value });
              }}
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
            />
          </View>

          {transaction.type === "expense" && (
            <View style={styles.inputContainer}>
              <Typo color={colors.neutral200}>Categorie</Typo>
              <Dropdown
                style={styles.dropdownContainer}
                selectedTextStyle={styles.dropdownSelectedText}
                iconStyle={styles.dropdownIcon}
                activeColor={colors.neutral700}
                placeholder="Selectionner un portefeuille"
                placeholderStyle={styles.dropdownPlaceholder}
                data={Object.keys(expenseCategories)}
                maxHeight={300}
                labelField="label"
                valueField="value"
                value={walletsItem[0].name}
                onChange={(item) => {
                  setTransaction({ ...transaction, category: item.value });
                }}
                itemTextStyle={styles.dropdownItemText}
                itemContainerStyle={styles.dropdownItemContainer}
                containerStyle={styles.dropdownListContainer}
              />
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {oldTransaction.name && !loading && (
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
              {oldTransaction.name ? "Modifier" : "Ajouter"} le portefeuille
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
  iosDropDown: {
    flexDirection: "row",
    height: verticalScale(54),
    alignItems: "center",
    justifyContent: "center",
    fontSize: verticalScale(14),
    borderWidth: 1,
    color: colors.white,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
  },
  androidDropDown: {
    height: verticalScale(54),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    fontSize: verticalScale(14),
    color: colors.white,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: "continuous",
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._5,
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
  iosDatePicker: {
    //
  },
  datePickerButton: {
    backgroundColor: colors.neutral700,
    alignSelf: "flex-end",
    padding: spacingY._7,
    marginRight: spacingX._7,
    paddingHorizontal: spacingY._7,
    borderRadius: radius._10,
  },
  dropdownContainer: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral300,
    paddingHorizontal: spacingX._15,
    borderRadius: radius._15,
    borderCurve: "continuous",
  },
  dropdownItemText: {
    color: colors.white,
  },
  dropdownSelectedText: {
    color: colors.white,
    fontSize: verticalScale(14),
  },
  dropdownListContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    borderCurve: "continuous",
    paddingVertical: spacingY._7,
    top: 5,
    borderColor: colors.neutral500,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  dropdownPlaceholder: {
    color: colors.white,
  },
  dropdownItemContainer: {
    borderRadius: radius._15,
    marginHorizontal: spacingX._7,
  },
  dropdownIcon: {
    height: verticalScale(30),
    tintColor: colors.neutral300,
  },
});
