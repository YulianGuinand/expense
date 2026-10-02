import { BlobatarAvatar } from "@/components/Avatar/BlobatarAvatar";
import { Header } from "@/components/Header";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Typo } from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { accountOptionType } from "@/types";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import {
  CaretRightIcon,
  GearIcon,
  LockIcon,
  PowerIcon,
  UserIcon,
} from "phosphor-react-native";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
const accountOptions: accountOptionType[] = [
  {
    title: "Modifier le profil",
    icon: <UserIcon size={26} color={colors.white} />,
    bgColor: "#6366f1",
    routeName: "/(modals)/profileModal",
  },
  {
    title: "Paramêtres",
    icon: <GearIcon size={26} color={colors.white} />,
    bgColor: "#059669",
  },
  {
    title: "Politique de confidentialité",
    icon: <LockIcon size={26} color={colors.white} />,
    bgColor: colors.neutral600,
  },
  {
    title: "Se deconnecter",
    icon: <PowerIcon size={26} color={colors.white} />,
    bgColor: "#e11d48",
  },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const showLogoutAlert = () => {
    Alert.alert("Confirmer", "Êtes vous sur de vous deconnecter ?", [
      {
        text: "Annuler",
        onPress: () => console.log("Cancel logout"),
        style: "cancel",
      },
      {
        text: "Se deconnecter",
        style: "destructive",
        onPress: () => handleLogout(),
      },
    ]);
  };

  const handleLogout = async () => {
    const res = await logout();
    if (res.success) router.replace("/welcome");
  };

  const handleOnPress = (item: accountOptionType) => {
    if (item.title === "Se deconnecter") {
      showLogoutAlert();
    }

    if (item.routeName) {
      router.push(item.routeName);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* header */}
        <Header title="Profil" style={{ marginVertical: spacingY._10 }} />

        {/* user info */}
        <View style={styles.userInfo}>
          {/* avatar */}
          <View>
            <BlobatarAvatar
              name={user?.username || user?.email || "expense"}
              size={verticalScale(135)}
            />
          </View>

          {/* name & email */}
          <View style={styles.nameContainer}>
            <Typo size={24} fontWeight={"600"} color={colors.neutral100}>
              {user?.username}
            </Typo>
            <Typo size={15} color={colors.neutral400}>
              {user?.email}
            </Typo>
          </View>
        </View>

        {/* account options */}
        <View style={styles.accountOptions}>
          {accountOptions.map((item, index) => {
            return (
              <Animated.View
                entering={FadeInDown.delay(index * 50)
                  .springify()
                  .damping(60)}
                key={item.title}
                style={styles.listIem}
              >
                <TouchableOpacity
                  style={styles.flexRow}
                  onPress={() => handleOnPress(item)}
                >
                  {/* icon */}
                  <View
                    style={[styles.listIcon, { backgroundColor: item.bgColor }]}
                  >
                    {item.icon}
                  </View>
                  <Typo size={16} style={{ flex: 1 }} fontWeight={"500"}>
                    {item.title}
                  </Typo>
                  <CaretRightIcon
                    size={verticalScale(20)}
                    weight="bold"
                    color={colors.white}
                  />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  userInfo: {
    marginTop: verticalScale(30),
    alignItems: "center",
    gap: spacingY._15,
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
  },
  editIcon: {
    position: "absolute",
    bottom: 5,
    right: 8,
    borderRadius: 50,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: 5,
  },
  nameContainer: {
    gap: verticalScale(4),
    alignItems: "center",
  },
  listIcon: {
    height: verticalScale(44),
    width: verticalScale(44),
    backgroundColor: colors.neutral500,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius._15,
    borderCurve: "continuous",
  },
  listIem: {
    marginBottom: verticalScale(17),
  },
  accountOptions: {
    marginTop: spacingY._25,
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
});
