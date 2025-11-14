import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Switch,
  Divider,
  Button,
  Input,
  Avatar,
  Skeleton,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../contexts";
import { useLogout } from "../../hooks/useLogout";
import axios from "axios";
import type { User } from "../../types";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { logout, isLoggingOut } = useLogout();

  // Stato per i dati utente
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Stato per il form del profilo
  const [profileData, setProfileData] = useState({
    name: "",
    surname: "",
    email: "",
  });
  const [originalProfileData, setOriginalProfileData] = useState({
    name: "",
    surname: "",
    email: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Stato per l'immagine del profilo
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stato per la password
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch dati utente
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoadingUser(true);
      try {
        const response = await axios.get(
          "/authentication/GET/get-session-data",
          {
            withCredentials: true,
          }
        );

        if (response.data && response.data.user) {
          const userData = response.data.user;
          const initialData = {
            name: (userData.name || "").trim(),
            surname: (userData.surname || "").trim(),
            email: (userData.email || "").trim(),
          };
          setUser(userData);
          // Imposta i dati originali PRIMA di profileData per evitare race conditions
          setOriginalProfileData(initialData);
          setProfileData(initialData);
          // Imposta l'immagine del profilo se presente
          if (userData.profile_image_url) {
            setProfileImage(userData.profile_image_url);
          } else {
            // Reset se non c'è immagine
            setProfileImage(null);
          }
        } else if (response.data) {
          const userData = response.data;
          const initialData = {
            name: (userData.name || "").trim(),
            surname: (userData.surname || "").trim(),
            email: (userData.email || "").trim(),
          };
          setUser(userData);
          // Imposta i dati originali PRIMA di profileData per evitare race conditions
          setOriginalProfileData(initialData);
          setProfileData(initialData);
          // Imposta l'immagine del profilo se presente
          if (userData.profile_image_url) {
            setProfileImage(userData.profile_image_url);
          } else {
            // Reset se non c'è immagine
            setProfileImage(null);
          }
        }
      } catch (error) {
        console.error("Errore nel recupero dei dati utente:", error);
        addToast({
          title: "Errore",
          description: "Impossibile caricare i dati del profilo",
          color: "danger",
        });
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  // Genera le iniziali per l'avatar
  const getInitials = (name: string, surname: string) => {
    const firstInitial = name ? name.charAt(0).toUpperCase() : "";
    const lastInitial = surname ? surname.charAt(0).toUpperCase() : "";
    return firstInitial + lastInitial;
  };

  // Costruisce l'URL dell'immagine del profilo
  const getProfileImageUrl = () => {
    // Se c'è una preview locale (immagine selezionata ma non ancora caricata)
    if (profileImage && profileImage.startsWith("data:")) {
      return profileImage;
    }

    // Se c'è un'immagine profilo dal backend
    const profileImageUrl = profileImage || (user as any)?.profile_image_url;

    if (profileImageUrl) {
      // Se l'URL è assoluto (inizia con http:// o https://), usalo direttamente
      if (
        profileImageUrl.startsWith("http://") ||
        profileImageUrl.startsWith("https://")
      ) {
        return profileImageUrl;
      }
      // Se è relativo, costruisci l'URL completo usando il baseURL
      // Rimuovi /API/v1 o /API/V1 (case insensitive) dal baseURL
      const baseURL = axios.defaults.baseURL?.replace(/\/API\/v1/i, "") || "";
      return `${baseURL}${
        profileImageUrl.startsWith("/") ? "" : "/"
      }${profileImageUrl}`;
    }

    // Fallback: nessuna immagine, l'Avatar mostrerà le iniziali
    return undefined;
  };

  // Gestisce la selezione del file immagine
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validazione tipo file
    if (!file.type.startsWith("image/")) {
      addToast({
        title: "Errore",
        description: "Seleziona un file immagine valido",
        color: "danger",
      });
      return;
    }

    // Validazione dimensione (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "Errore",
        description: "L'immagine deve essere inferiore a 5MB",
        color: "danger",
      });
      return;
    }

    // Crea preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
      setProfileImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  // Gestisce l'upload dell'immagine
  const handleUploadImage = async () => {
    if (!profileImageFile) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      // Il nome del campo deve corrispondere a quello che Multer si aspetta
      // Se Multer usa .single('profile_image'), usa "profile_image"
      // Se Multer usa .single('file'), usa "file"
      formData.append("profile_image", profileImageFile);

      const response = await axios.put(
        "/authentication/UPDATE/upload-profile-image",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        // Aggiorna l'URL dell'immagine se fornito dal backend
        if (response.data?.profile_image_url) {
          setProfileImage(response.data.profile_image_url);
        }
        // Aggiorna anche lo stato user se la risposta contiene i dati aggiornati
        if (response.data && response.data.user) {
          setUser(response.data.user);
        }

        setProfileImageFile(null);

        // Notifica altri componenti dell'aggiornamento del profilo
        window.dispatchEvent(new Event("user-profile-updated"));

        addToast({
          title: "Successo",
          description: "Immagine del profilo aggiornata con successo",
          color: "success",
        });
      }
    } catch (error: any) {
      console.error("Errore nell'upload dell'immagine:", error);
      addToast({
        title: "Errore",
        description:
          error.response?.data?.message ||
          "Impossibile caricare l'immagine del profilo",
        color: "danger",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Gestisce il click sull'avatar per selezionare un'immagine
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Verifica se ci sono modifiche al profilo
  const hasProfileChanges = useMemo(() => {
    if (isLoadingUser) return false;

    const normalize = (value: string) => (value || "").trim();

    const nameChanged =
      normalize(profileData.name) !== normalize(originalProfileData.name);
    const surnameChanged =
      normalize(profileData.surname) !== normalize(originalProfileData.surname);
    const emailChanged =
      normalize(profileData.email) !== normalize(originalProfileData.email);

    return nameChanged || surnameChanged || emailChanged;
  }, [profileData, originalProfileData, isLoadingUser]);

  // Salva modifiche profilo
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const response = await axios.put(
        "/authentication/UPDATE/update-profile",
        {
          name: (profileData.name || "").trim(),
          surname: (profileData.surname || "").trim(),
          email: (profileData.email || "").trim(),
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        // Aggiorna i dati originali dopo il salvataggio
        const savedData = {
          name: (profileData.name || "").trim(),
          surname: (profileData.surname || "").trim(),
          email: (profileData.email || "").trim(),
        };
        setOriginalProfileData(savedData);

        // Aggiorna anche lo stato user se la risposta contiene i dati aggiornati
        if (response.data && response.data.user) {
          setUser(response.data.user);
        }

        addToast({
          title: "Successo",
          description: "Profilo aggiornato con successo",
          color: "success",
        });
      }
    } catch (error: any) {
      console.error("Errore nell'aggiornamento del profilo:", error);
      addToast({
        title: "Errore",
        description:
          error.response?.data?.message || "Impossibile salvare le modifiche",
        color: "danger",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Cambia password
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast({
        title: "Errore",
        description: "Le password non corrispondono",
        color: "danger",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      addToast({
        title: "Errore",
        description: "La password deve essere di almeno 8 caratteri",
        color: "danger",
      });
      return;
    }

    if (!passwordData.currentPassword) {
      addToast({
        title: "Errore",
        description: "Inserisci la password attuale",
        color: "danger",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await axios.put(
        "/authentication/UPDATE/change-password",
        {
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        addToast({
          title: "Successo",
          description: "Password cambiata con successo",
          color: "success",
        });
      }
    } catch (error: any) {
      console.error("Errore nel cambio password:", error);
      addToast({
        title: "Errore",
        description:
          error.response?.data?.message || "Impossibile cambiare la password",
        color: "danger",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Impostazioni</h1>
          <p className="text-default-500 mt-2">
            Gestisci le tue preferenze e configurazioni
          </p>
        </div>
      </div>

      {/* Profilo Utente - Card Principale */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4 w-full">
            {isLoadingUser ? (
              <Skeleton className="rounded-full w-16 h-16" />
            ) : (
              <div className="relative group">
                <div
                  className="cursor-pointer"
                  onClick={handleAvatarClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleAvatarClick();
                    }
                  }}
                >
                  <Avatar
                    isBordered
                    size="lg"
                    src={getProfileImageUrl()}
                    name={
                      user
                        ? getInitials(user.name || "", user.surname || "")
                        : "U"
                    }
                    showFallback
                    className="w-16 h-16 transition-opacity group-hover:opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Icon
                      icon="solar:camera-bold"
                      className="text-white text-xl"
                    />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>
            )}
            <div className="flex-1">
              {isLoadingUser ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48 rounded-lg" />
                  <Skeleton className="h-4 w-64 rounded-lg" />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">
                    {user?.name && user?.surname
                      ? `${user.name} ${user.surname}`
                      : user?.name || user?.surname || "Utente"}
                  </h2>
                  <p className="text-default-500 text-sm">
                    {user?.email || ""}
                  </p>
                </>
              )}
            </div>
            <Icon icon="solar:user-outline" className="text-primary text-2xl" />
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome"
              placeholder="Il tuo nome"
              value={profileData.name}
              onValueChange={(value) =>
                setProfileData({ ...profileData, name: value })
              }
              variant="bordered"
              isDisabled={isLoadingUser}
              startContent={
                <Icon icon="solar:user-bold" className="text-default-400" />
              }
            />
            <Input
              label="Cognome"
              placeholder="Il tuo cognome"
              value={profileData.surname}
              onValueChange={(value) =>
                setProfileData({ ...profileData, surname: value })
              }
              variant="bordered"
              isDisabled={isLoadingUser}
              startContent={
                <Icon icon="solar:user-bold" className="text-default-400" />
              }
            />
          </div>
          <Input
            label="Email"
            placeholder="la-tua-email@example.com"
            value={profileData.email}
            onValueChange={(value) =>
              setProfileData({ ...profileData, email: value })
            }
            variant="bordered"
            type="email"
            isDisabled={isLoadingUser}
            className="mt-4"
            startContent={
              <Icon icon="solar:letter-bold" className="text-default-400" />
            }
          />
          <div className="flex gap-3 mt-6">
            {profileImageFile && (
              <Button
                color="primary"
                variant="flat"
                onPress={handleUploadImage}
                isLoading={isUploadingImage}
                isDisabled={isUploadingImage}
                startContent={
                  !isUploadingImage && (
                    <Icon icon="solar:upload-bold" width={20} />
                  )
                }
              >
                {isUploadingImage ? "Caricamento..." : "Carica Immagine"}
              </Button>
            )}
            <Button
              color="primary"
              className="w-fit"
              onPress={handleSaveProfile}
              isLoading={isSavingProfile}
              isDisabled={
                !hasProfileChanges || isSavingProfile || isLoadingUser
              }
              startContent={
                !isSavingProfile && (
                  <Icon icon="solar:check-circle-bold" width={20} />
                )
              }
            >
              {isSavingProfile ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Aspetto */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon
                icon="solar:palette-outline"
                className="text-primary text-xl"
              />
            </div>
            <h3 className="text-lg font-semibold">Aspetto</h3>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">Tema</p>
              <p className="text-small text-default-500">
                Scegli tra tema chiaro e scuro
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Icon
                icon={theme === "light" ? "solar:sun-bold" : "solar:moon-bold"}
                className="text-xl text-foreground"
              />
              <Switch
                isSelected={theme === "dark"}
                onValueChange={toggleTheme}
                color="primary"
                size="lg"
                classNames={{
                  wrapper:
                    "group-data-[selected=true]:bg-default-300 dark:group-data-[selected=true]:bg-default-400",
                  thumb: "bg-white group-data-[selected=true]:bg-white",
                }}
              />
              <span className="text-small font-medium text-foreground min-w-[60px]">
                {theme === "dark" ? "Scuro" : "Chiaro"}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Sicurezza */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon
                icon="solar:shield-outline"
                className="text-primary text-xl"
              />
            </div>
            <h3 className="text-lg font-semibold">Sicurezza</h3>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="pt-6">
          <div className="space-y-4 max-w-2xl">
            <Input
              label="Password Attuale"
              placeholder="Inserisci la password attuale"
              type="password"
              variant="bordered"
              value={passwordData.currentPassword}
              onValueChange={(value) =>
                setPasswordData({ ...passwordData, currentPassword: value })
              }
              startContent={
                <Icon
                  icon="solar:lock-password-bold"
                  className="text-default-400"
                />
              }
            />
            <Input
              label="Nuova Password"
              placeholder="Inserisci la nuova password"
              type="password"
              variant="bordered"
              value={passwordData.newPassword}
              onValueChange={(value) =>
                setPasswordData({ ...passwordData, newPassword: value })
              }
              startContent={
                <Icon
                  icon="solar:lock-password-bold"
                  className="text-default-400"
                />
              }
            />
            <Input
              label="Conferma Password"
              placeholder="Conferma la nuova password"
              type="password"
              variant="bordered"
              value={passwordData.confirmPassword}
              onValueChange={(value) =>
                setPasswordData({ ...passwordData, confirmPassword: value })
              }
              startContent={
                <Icon
                  icon="solar:lock-password-bold"
                  className="text-default-400"
                />
              }
            />
            <Button
              color="primary"
              className="w-fit"
              onPress={handleChangePassword}
              isLoading={isChangingPassword}
              startContent={
                !isChangingPassword && <Icon icon="solar:key-bold" width={20} />
              }
            >
              {isChangingPassword ? "Cambio in corso..." : "Cambia Password"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Zona Pericolosa */}
      <Card className="border-2 border-danger/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger/10">
              <Icon
                icon="solar:danger-triangle-outline"
                className="text-danger text-xl"
              />
            </div>
            <h3 className="text-lg font-semibold text-danger">
              Zona Pericolosa
            </h3>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">Logout</p>
              <p className="text-small text-default-500">
                Disconnetti il tuo account e torna alla schermata di login
              </p>
            </div>
            <Button
              color="danger"
              variant="flat"
              onPress={logout}
              isLoading={isLoggingOut}
              isDisabled={isLoggingOut}
              startContent={
                !isLoggingOut && <Icon icon="solar:logout-2-bold" width={20} />
              }
            >
              {isLoggingOut ? "Disconnessione..." : "Logout"}
            </Button>
          </div>

          <Divider />

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">Elimina Account</p>
              <p className="text-small text-default-500">
                Elimina permanentemente il tuo account e tutti i dati associati.
                Questa azione non può essere annullata.
              </p>
            </div>
            <Button
              color="danger"
              variant="flat"
              startContent={
                <Icon icon="solar:trash-bin-trash-bold" width={20} />
              }
            >
              Elimina Account
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
