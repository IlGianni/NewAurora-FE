"use client";

import React from "react";
import { Button, Input, Link, Form, InputOtp, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

type Step = "email" | "otp" | "reset-password";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const [showOtpSuccess, setShowOtpSuccess] = React.useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = React.useState(false);
  const [redirectCountdown, setRedirectCountdown] = React.useState(0);

  // Countdown timer per il riinvio OTP
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Countdown per il redirect
  React.useEffect(() => {
    if (redirectCountdown > 0) {
      const timer = setTimeout(
        () => setRedirectCountdown(redirectCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    } else if (redirectCountdown === 0 && showPasswordSuccess) {
      navigate("/");
    }
  }, [redirectCountdown, showPasswordSuccess, navigate]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const res = await axios.post("/authentication/POST/forgot-password", {
        email: email,
      });

      if (res.status === 200) {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Codice OTP inviato!",
          description: `Se l'email esiste nel nostro database, riceverai il codice di verifica a ${email}`,
          color: "success",
        });

        setStep("otp");
        setCountdown(60); // 60 secondi di attesa prima di poter rinviare
      }
    } catch (error: any) {
      console.error(error);

      // Gestione specifica per email non presente nel database
      if (
        error.response?.status === 404 ||
        error.response?.status === 400 ||
        error.response?.data?.message?.toLowerCase().includes("email") ||
        error.response?.data?.message?.toLowerCase().includes("non trovato") ||
        error.response?.data?.message?.toLowerCase().includes("not found")
      ) {
        addToast({
          timeout: 4000,
          shouldShowTimeoutProgress: true,
          title: "Email non trovata",
          description:
            "L'indirizzo email inserito non risulta registrato nel nostro sistema.",
          color: "warning",
        });
      } else {
        // Altri errori generici
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore",
          description: "Impossibile inviare il codice OTP. Riprova più tardi.",
          color: "danger",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (otp.length !== 6) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Codice incompleto",
        description: "Inserisci tutte le 6 cifre del codice OTP",
        color: "warning",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post("/authentication/POST/verify-otp", {
        email: email,
        otp: otp,
      });

      if (res.status === 200) {
        setShowOtpSuccess(true);

        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Codice verificato!",
          description: "Ora puoi impostare una nuova password",
          color: "success",
        });

        // Cambia lo step prima di nascondere l'overlay per transizione più fluida
        setTimeout(() => {
          setStep("reset-password");
          setTimeout(() => {
            setShowOtpSuccess(false);
          }, 100);
        }, 1500);
      }
    } catch (error: any) {
      console.error(error);
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Codice non valido",
        description: "Il codice OTP inserito non è corretto. Riprova.",
        color: "danger",
      });
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Le password non coincidono!",
        description: "Controlla le password inserite",
        color: "danger",
      });
      return;
    }

    if (password.length < 8) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Password troppo corta",
        description: "La password deve essere di almeno 8 caratteri",
        color: "warning",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post("/authentication/POST/reset-password", {
        email: email,
        otp: otp,
        new_password: password,
      });

      if (res.status === 200) {
        setShowPasswordSuccess(true);
        setRedirectCountdown(3);

        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Password reimpostata!",
          description: "La tua password è stata reimpostata con successo",
          color: "success",
        });
      }
    } catch (error: any) {
      console.error(error);

      // Gestione specifica per password uguale alla precedente
      const errorMessage = error.response?.data?.message?.toLowerCase() || "";
      if (
        error.response?.status === 400 &&
        (errorMessage.includes("stessa password") ||
          errorMessage.includes("same password") ||
          errorMessage.includes("uguale") ||
          errorMessage.includes("equal") ||
          errorMessage.includes("identica"))
      ) {
        addToast({
          timeout: 4000,
          shouldShowTimeoutProgress: true,
          title: "Password identica alla precedente",
          description:
            "La nuova password deve essere diversa dalla password attuale. Scegli una password diversa.",
          color: "warning",
        });
        setPassword("");
        setConfirmPassword("");
        return;
      }

      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description:
          error.response?.data?.message ||
          "Impossibile reimpostare la password. Riprova più tardi.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () =>
    setIsPasswordVisible(!isPasswordVisible);
  const toggleConfirmPasswordVisibility = () =>
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      const res = await axios.post("/authentication/POST/resend-otp", {
        email: email,
      });

      if (res.status === 200) {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Codice rinviato!",
          description: "Controlla la tua email per il nuovo codice",
          color: "success",
        });

        setCountdown(60);
        setOtp("");
      }
    } catch (error: any) {
      console.error(error);

      // Gestione specifica per email non presente nel database
      if (
        error.response?.status === 404 ||
        error.response?.status === 400 ||
        error.response?.data?.message?.toLowerCase().includes("email") ||
        error.response?.data?.message?.toLowerCase().includes("non trovato") ||
        error.response?.data?.message?.toLowerCase().includes("not found")
      ) {
        addToast({
          timeout: 4000,
          shouldShowTimeoutProgress: true,
          title: "Email non trovata",
          description:
            "L'indirizzo email inserito non risulta registrato nel nostro sistema.",
          color: "warning",
        });
        // Torna allo step email se l'email non esiste più
        setStep("email");
      } else {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore",
          description: "Impossibile rinviare il codice. Riprova più tardi.",
          color: "danger",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        layout
        className="relative overflow-hidden rounded-large bg-content1 shadow-large flex w-full max-w-md flex-col gap-4 px-8 py-8"
        style={{
          overflow: "visible",
          minHeight: showOtpSuccess ? "500px" : "auto",
        }}
      >
        {/* Success Animation per OTP - Posizionato nel container principale */}
        <AnimatePresence>
          {showOtpSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute flex items-center justify-center z-50 bg-content1 rounded-large"
              style={{
                top: "-1.5rem",
                right: "-2rem",
                bottom: "-2.5rem",
                left: "-2rem",
                width: "calc(100% + 4rem)",
                height: "calc(100% + 4rem)",
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.1,
                }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                      delay: 0.3,
                    }}
                  >
                    <Icon
                      icon="solar:check-circle-bold"
                      className="text-success text-6xl"
                    />
                  </motion.div>
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <h2 className="text-xl font-semibold text-success mb-1">
                    Codice verificato!
                  </h2>
                  <p className="text-small text-default-500">
                    Reindirizzamento...
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Animation per Reset Password - Posizionato nel container principale */}
        <AnimatePresence>
          {step === "reset-password" && showPasswordSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute flex items-center justify-center z-50 bg-content1 rounded-large"
              style={{
                top: "-1.5rem",
                right: "-2rem",
                bottom: "-2.5rem",
                left: "-2rem",
                width: "calc(100% + 4rem)",
                height: "calc(100% + 4rem)",
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.1,
                }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                      delay: 0.3,
                    }}
                  >
                    <Icon
                      icon="solar:check-circle-bold"
                      className="text-success text-6xl"
                    />
                  </motion.div>
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <h2 className="text-xl font-semibold text-success mb-1">
                    Password reimpostata!
                  </h2>
                  <p className="text-small text-default-500">
                    Reindirizzamento alla pagina di login tra{" "}
                    <motion.span
                      key={redirectCountdown}
                      initial={{ scale: 1.5, color: "#22c55e" }}
                      animate={{ scale: 1, color: "#22c55e" }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="font-bold text-success text-medium inline-block"
                    >
                      {redirectCountdown}
                    </motion.span>{" "}
                    {redirectCountdown === 1 ? "secondo" : "secondi"}...
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Step 1: Inserimento Email */}
          {step === "email" && (
            <motion.div
              key="email"
              animate={{ opacity: 1 }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <h1 className="text-large font-medium">Recupera password</h1>
                <p className="text-small text-default-500">
                  Inserisci la tua email per ricevere il codice di verifica
                </p>
              </div>

              <Form
                className="flex flex-col gap-3 mt-2"
                validationBehavior="native"
                onSubmit={handleEmailSubmit}
              >
                <Input
                  isRequired
                  label="Indirizzo Email"
                  name="email"
                  placeholder="esempio@email.com"
                  type="email"
                  variant="bordered"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startContent={
                    <Icon
                      className="text-default-400"
                      icon="solar:letter-linear"
                      width={20}
                    />
                  }
                />

                <Button
                  className="w-full"
                  color="primary"
                  variant="solid"
                  type="submit"
                  isLoading={isLoading}
                >
                  Invia codice OTP
                </Button>
              </Form>

              <div className="text-center pt-2">
                <Link
                  href="#"
                  size="sm"
                  onPress={() => navigate("/")}
                  className="text-default-500"
                >
                  <Icon
                    icon="solar:arrow-left-linear"
                    className="inline mr-1"
                    width={16}
                  />
                  Torna al login
                </Link>
              </div>
            </motion.div>
          )}

          {/* Step 2: Inserimento OTP */}
          {step === "otp" && !showOtpSuccess && (
            <motion.div
              key="otp"
              animate={{ opacity: 1 }}
              className="flex flex-col gap-6 relative w-full"
            >
              <div className="flex flex-col gap-2 items-center w-full">
                <motion.div
                  initial={{ scale: 1, rotate: 0 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2"
                >
                  <Icon
                    icon="solar:shield-check-linear"
                    className="text-primary text-3xl"
                  />
                </motion.div>
                <h1 className="text-large font-medium text-center">
                  Verifica codice OTP
                </h1>
                <p className="text-small text-default-500 text-center">
                  Inserisci il codice a 6 cifre inviato a{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <Form
                className="flex flex-col gap-6 items-center w-full"
                validationBehavior="native"
                onSubmit={handleOtpSubmit}
              >
                <div className="w-full flex justify-center items-center min-h-[120px]">
                  <InputOtp
                    length={6}
                    value={otp}
                    onValueChange={setOtp}
                    variant="bordered"
                    color="primary"
                    size="lg"
                    radius="lg"
                    classNames={{
                      base: "justify-center w-auto",
                      wrapper: "justify-center",
                      input: "text-2xl font-bold tracking-wider",
                      segmentWrapper: "gap-3 justify-center flex",
                      segment:
                        "w-14 h-14 text-2xl font-bold border-2 transition-colors duration-200 data-[focus=true]:border-primary-500 data-[focus=true]:shadow-lg data-[has-value=true]:bg-primary-50 dark:data-[has-value=true]:bg-primary-950/20 flex items-center justify-center",
                    }}
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <Button
                    className="w-full"
                    color="primary"
                    variant="solid"
                    size="lg"
                    type="submit"
                    isLoading={isLoading}
                    isDisabled={otp.length !== 6}
                  >
                    Verifica codice
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-small">
                    <span className="text-default-500">
                      Non hai ricevuto il codice?
                    </span>
                    {countdown > 0 ? (
                      <span className="text-default-400 font-medium">
                        Attendi {countdown}s
                      </span>
                    ) : (
                      <Button
                        variant="light"
                        size="sm"
                        onPress={handleResendOtp}
                        isLoading={isResending}
                        className="h-auto min-w-0 p-0 text-primary font-medium"
                      >
                        Rinvialo
                      </Button>
                    )}
                  </div>
                </div>
              </Form>

              <div className="text-center pt-2">
                <Link
                  href="#"
                  size="sm"
                  onPress={() => {
                    setStep("email");
                    setOtp("");
                  }}
                  className="text-default-500"
                >
                  <Icon
                    icon="solar:arrow-left-linear"
                    className="inline mr-1"
                    width={16}
                  />
                  Cambia email
                </Link>
              </div>
            </motion.div>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset-password" && (
            <motion.div
              key="reset-password"
              animate={{ opacity: 1 }}
              className="flex flex-col gap-4 relative"
            >
              <div className="flex flex-col gap-1">
                <h1 className="text-large font-medium">
                  Imposta nuova password
                </h1>
                <p className="text-small text-default-500">
                  Scegli una nuova password sicura per il tuo account
                </p>
              </div>

              <Form
                className="flex flex-col gap-3"
                validationBehavior="native"
                onSubmit={handleResetPassword}
              >
                <Input
                  isRequired
                  label="Nuova Password"
                  name="password"
                  placeholder="Inserisci la nuova password"
                  type={isPasswordVisible ? "text" : "password"}
                  variant="bordered"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  endContent={
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="focus:outline-none"
                    >
                      {isPasswordVisible ? (
                        <Icon
                          className="text-default-400 text-2xl cursor-pointer"
                          icon="solar:eye-closed-linear"
                        />
                      ) : (
                        <Icon
                          className="text-default-400 text-2xl cursor-pointer"
                          icon="solar:eye-bold"
                        />
                      )}
                    </button>
                  }
                  description="La password deve essere di almeno 8 caratteri"
                />

                <Input
                  isRequired
                  label="Conferma Password"
                  name="confirm_password"
                  placeholder="Conferma la nuova password"
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  variant="bordered"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  endContent={
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="focus:outline-none"
                    >
                      {isConfirmPasswordVisible ? (
                        <Icon
                          className="text-default-400 text-2xl cursor-pointer"
                          icon="solar:eye-closed-linear"
                        />
                      ) : (
                        <Icon
                          className="text-default-400 text-2xl cursor-pointer"
                          icon="solar:eye-bold"
                        />
                      )}
                    </button>
                  }
                  isInvalid={
                    confirmPassword !== "" && password !== confirmPassword
                  }
                  errorMessage={
                    confirmPassword !== "" && password !== confirmPassword
                      ? "Le password non coincidono"
                      : undefined
                  }
                />

                <Button
                  className="w-full"
                  color="primary"
                  variant="solid"
                  type="submit"
                  isLoading={isLoading}
                  isDisabled={
                    password.length < 8 || confirmPassword !== password
                  }
                >
                  Reimposta password
                </Button>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
