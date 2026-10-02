import { expenseCategories, incomeCategories } from "@/constants/data";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { TransactionItemProps, TransactionListType } from "@/types";
import { verticalScale } from "@/utils/styling";
import { FlashList } from "@shopify/flash-list";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Loading } from "./Loading";
import { Typo } from "./Typo";

export function TransactionList({
  data,
  title,
  loading,
  emptyListMessage,
}: TransactionListType) {
  const handleClick = () => {};

  return (
    <View style={styles.container}>
      {title && (
        <Typo size={20} fontWeight={"500"}>
          {title}
        </Typo>
      )}

      <View style={styles.list}>
        <FlashList
          data={data}
          renderItem={({ item, index }) => (
            <TransactionItem
              item={item}
              index={index}
              handleClick={handleClick}
            />
          )}
        />
      </View>
      {!loading && data.length === 0 && (
        <Typo
          size={15}
          color={colors.neutral400}
          style={{ textAlign: "center", marginTop: spacingY._15 }}
        >
          {emptyListMessage}
        </Typo>
      )}

      {loading && (
        <View style={{ top: verticalScale(100) }}>
          <Loading />
        </View>
      )}
    </View>
  );
}

const TransactionItem = ({
  item,
  index,
  handleClick,
}: TransactionItemProps) => {
  const categorySource =
    item.type === "income" ? incomeCategories : expenseCategories;

  const category = categorySource[item.category || "others"] ||
    expenseCategories["others"] || {
      label: item.category || "Autre",
      icon: null,
      bgColor: colors.neutral700,
    };

  const IconComponent = category.icon as React.ComponentType<{
    size?: number;
    weight?: string;
    color?: string;
  }>;

  const isExpense = item.type === "expense";

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "";
    if (typeof dateValue === "string") return dateValue;

    const d =
      typeof dateValue.toDate === "function"
        ? dateValue.toDate()
        : new Date(dateValue);

    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70)
        .springify()
        .damping(60)}
    >
      <TouchableOpacity style={styles.row} onPress={() => handleClick(item)}>
        <View
          style={[
            styles.icon,
            { backgroundColor: String(category.bgColor || colors.neutral700) },
          ]}
        >
          {IconComponent && (
            <IconComponent
              size={verticalScale(25)}
              weight="fill"
              color={colors.white}
            />
          )}
        </View>

        <View style={styles.categoryDes}>
          <Typo size={17}>{category.label}</Typo>
          <Typo
            size={12}
            color={colors.neutral400}
            textProps={{ numberOfLines: 1 }}
          >
            {item.description}
          </Typo>
        </View>

        <View style={styles.amountDate}>
          <Typo
            fontWeight={"500"}
            color={isExpense ? colors.rose : colors.green}
          >
            {isExpense ? "- " : "+ "}
            {item.amount}€
          </Typo>

          <Typo size={13} color={colors.neutral400}>
            {formatDate(item.date)}
          </Typo>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacingY._17,
  },
  list: {
    minHeight: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacingX._12,
    marginBottom: spacingY._12,
    backgroundColor: colors.neutral800,
    padding: spacingY._10,
    paddingHorizontal: spacingY._10,
    borderRadius: radius._17,
  },
  icon: {
    height: verticalScale(44),
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius._12,
    borderCurve: "continuous",
  },
  categoryDes: {
    flex: 1,
    gap: 2.5,
  },
  amountDate: {
    alignItems: "flex-end",
    gap: 3,
  },
});
