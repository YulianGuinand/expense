import { ExpenseCategoriesType } from "@/types";
import * as Icons from "phosphor-react-native";

export const expenseCategories: ExpenseCategoriesType = {
  groceries: {
    label: "Courses",
    value: "groceries",
    icon: Icons.ShoppingCartIcon,
    bgColor: "#4B5563",
  },
  food: {
    label: "Alimentation",
    value: "food",
    icon: Icons.ForkKnifeIcon,
    bgColor: "#be185d",
  },
  rent: {
    label: "Loyer",
    value: "rent",
    icon: Icons.HouseIcon,
    bgColor: "#075985",
  },
  utilities: {
    label: "Factures & Services",
    value: "utilities",
    icon: Icons.LightbulbIcon,
    bgColor: "#ca8a04",
  },
  transportation: {
    label: "Transport",
    value: "transportation",
    icon: Icons.CarIcon,
    bgColor: "#b45309",
  },
  transport: {
    label: "Transport",
    value: "transport",
    icon: Icons.CarIcon,
    bgColor: "#b45309",
  },
  entertainment: {
    label: "Divertissement",
    value: "entertainment",
    icon: Icons.FilmStripIcon,
    bgColor: "#0f766e",
  },
  dining: {
    label: "Restaurant",
    value: "dining",
    icon: Icons.ForkKnifeIcon,
    bgColor: "#be185d",
  },
  health: {
    label: "Santé",
    value: "health",
    icon: Icons.HeartIcon,
    bgColor: "#e11d48",
  },
  insurance: {
    label: "Assurance",
    value: "insurance",
    icon: Icons.ShieldCheckIcon,
    bgColor: "#404040",
  },
  savings: {
    label: "Épargne",
    value: "savings",
    icon: Icons.PiggyBankIcon,
    bgColor: "#065F46",
  },
  clothing: {
    label: "Vêtements",
    value: "clothing",
    icon: Icons.TShirtIcon,
    bgColor: "#7c3aed",
  },
  shopping: {
    label: "Shopping",
    value: "shopping",
    icon: Icons.BagIcon,
    bgColor: "#9333ea",
  },
  subscriptions: {
    label: "Abonnements",
    value: "subscriptions",
    icon: Icons.CreditCardIcon,
    bgColor: "#2563eb",
  },
  personal: {
    label: "Personnel",
    value: "personal",
    icon: Icons.UserIcon,
    bgColor: "#a21caf",
  },
  others: {
    label: "Autres",
    value: "others",
    icon: Icons.DotsThreeOutlineIcon,
    bgColor: "#525252",
  },
};

export const incomeCategories: ExpenseCategoriesType = {
  salary: {
    label: "Salaire",
    value: "salary",
    icon: Icons.MoneyIcon,
    bgColor: "#16a34a",
  },
  freelance: {
    label: "Freelance",
    value: "freelance",
    icon: Icons.BriefcaseIcon,
    bgColor: "#059669",
  },
  gift: {
    label: "Cadeau",
    value: "gift",
    icon: Icons.GiftIcon,
    bgColor: "#10b981",
  },
  others: {
    label: "Autres revenus",
    value: "others",
    icon: Icons.CurrencyDollarSimpleIcon,
    bgColor: "#047857",
  },
};

export const transactionTypes = [
  { label: "Dépense", value: "expense" },
  { label: "Revenu", value: "income" },
];
