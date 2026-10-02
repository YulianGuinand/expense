import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Typo } from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import { AtIcon, LockIcon, UserIcon } from "phosphor-react-native";
import { useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

export default function Register() {
  const usernameRef = useRef("");
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const confirmPasswordRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async () => {
    if (
      !usernameRef.current ||
      !emailRef.current ||
      !passwordRef.current ||
      !confirmPasswordRef.current
    ) {
      Alert.alert(
        "Inscription",
        "Renseignez s'il vous plaît, toutes les valeurs",
      );
      return;
    }

    if (passwordRef.current.length < 6) {
      Alert.alert("Inscription", "Le mot de passe doit comporter au moins 6 caractères");
      return;
    }

    if (confirmPasswordRef.current !== passwordRef.current) {
      Alert.alert("Inscription", "Veuillez confirmer votre mot de passe");
      return;
    }

    setIsLoading(true);
    const res = await register({
      username: usernameRef.current.trim(),
      email: emailRef.current.trim(),
      password: passwordRef.current,
    });
    setIsLoading(false);
    if (res.success) {
      router.replace("/(tabs)");
    } else {
      Alert.alert("Inscription", res.msg || "Une erreur est survenue lors de l'inscription.");
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <BackButton iconSize={28} />

          <View style={{ gap: 5 }}>
            <Typo size={30} fontWeight={"800"}>
              Hey,
            </Typo>
            <Typo size={30} fontWeight={"800"}>
              bienvenue sur Expense !
            </Typo>
          </View>

          {/* form */}
          <View style={styles.form}>
            <Typo size={16} color={colors.textLighter}>
              Inscrivez vous maintenant pour tracer vos dépenses.
            </Typo>

            <Input
              placeholder="Entrer votre nom d'utilisateur"
              icon={<UserIcon color={colors.neutral300} size={verticalScale(26)} />}
              onChangeText={(value) => (usernameRef.current = value)}
            />

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

            <Input
              placeholder="Confirmer votre mot de passe"
              secureTextEntry
              icon={
                <LockIcon color={colors.neutral300} size={verticalScale(26)} />
              }
              onChangeText={(value) => (confirmPasswordRef.current = value)}
            />

            <Button onPress={handleSubmit} loading={isLoading}>
              <Typo fontWeight={"700"} color={colors.neutral900} size={21}>
                S&apos;inscrire
              </Typo>
            </Button>
          </View>

          <View style={styles.footer}>
            <Typo size={15} color={colors.textLighter}>
              Vous possedez déjà un compte ?
            </Typo>
            <Pressable onPress={() => router.push("/(auth)/login")}>
              <Typo size={15} color={colors.primary} fontWeight={"700"}>
                Se connecter
              </Typo>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._40, 
  },
  form: {
    gap: spacingY._20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginBottom: spacingY._20,
  },
});