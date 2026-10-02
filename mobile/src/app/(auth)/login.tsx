import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Typo } from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import { AtIcon, LockIcon } from "phosphor-react-native";
import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

export default function Login() {
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert(
        "Connexion",
        "Renseignez s'il vous plaît, toutes les valeurs",
      );
      return;
    }
    setIsLoading(true);
    const res = await login({
      email: emailRef.current.trim(),
      password: passwordRef.current,
    });
    setIsLoading(false);
    if (res.success) {
      router.replace("/(tabs)");
    } else {
      Alert.alert("Connexion", res.msg || "Identifiants incorrects.");
    }
    return;
  };
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Back button */}
        <BackButton iconSize={28} />

        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={"800"}>
            Hey,
          </Typo>
          <Typo size={30} fontWeight={"800"}>
            bon retour !
          </Typo>
        </View>

        {/* form */}
        <View style={styles.form}>
          <Typo size={16} color={colors.textLighter}>
            Connectez vous maintenant pour tracer vos dépenses.
          </Typo>

          <Input
            placeholder="Entrer votre email"
            icon={<AtIcon color={colors.neutral300} size={verticalScale(26)} />}
            onChangeText={(value) => (emailRef.current = value)}
          />

          <Input
            placeholder="Entrer votre mot de passe"
            secureTextEntry
            icon={
              <LockIcon color={colors.neutral300} size={verticalScale(26)} />
            }
            onChangeText={(value) => (passwordRef.current = value)}
          />

          <Typo size={14} color={colors.text} style={{ alignSelf: "flex-end" }}>
            Mot de passe oublié ?
          </Typo>

          <Button onPress={handleSubmit} loading={isLoading}>
            <Typo fontWeight={"700"} color={colors.neutral900} size={21}>
              Se connecter
            </Typo>
          </Button>
        </View>

        <View style={styles.footer}>
          <Typo size={15} color={colors.textLighter}>
            Vous n&apos;avez pas encore de compte ?
          </Typo>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Typo size={15} color={colors.primary} fontWeight={"700"}>
              S&apos;inscrire
            </Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  welcomeText: {
    fontSize: verticalScale(20),
    fontWeight: "bold",
    color: colors.text,
  },
  form: {
    gap: spacingY._20,
  },
  forgotPassword: {
    textAlign: "right",
    fontWeight: "500",
    color: colors.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    textAlign: "center",
    color: colors.text,
    fontSize: verticalScale(15),
  },
});
