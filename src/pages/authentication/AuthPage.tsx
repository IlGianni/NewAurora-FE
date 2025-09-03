"use client";

import React from "react";
import {
  Button,
  Input,
  Checkbox,
  Link,
  Form,
  Divider,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

export default function AuthPage() {
  const [isLoginMode, setIsLoginMode] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    name: "",
    surname: "",
    company_id: "",
    confirm_password: "",
  });

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoginMode) {
      // Login
      const loginData = {
        email: formData.email,
        password: formData.password,
      };

      await axios
        .post("/authentication/POST/login", { login_data: loginData })
        .then((res) => {
          if (res.status === 200) {
            addToast({
              timeout: 3000,
              shouldShowTimeoutProgress: true,
              title: "Login effettuato con successo!",
              description: "Sarai reindirizzato alla dashboard...",
              color: "success",
            });
            location.href = "/dashboard";
          } else {
            addToast({
              timeout: 3000,
              shouldShowTimeoutProgress: true,
              title: "Errore durante il login",
              description: "Controlla i dati inseriti e riprova",
              color: "danger",
            });
          }
        })
        .catch((err) => {
          console.error(err);
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante il login",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        });
    } else {
      // Signup
      if (formData.password !== formData.confirm_password) {
        console.log("Password mismatch");
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Le password non coincidono!",
          description: "Controlla le password inserite",
          color: "danger",
        });
        return;
      }

      const signupData = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        password: formData.password,
        company_id: parseInt(formData.company_id),
      };

      await axios
        .post("/authentication/POST/register", { register_data: signupData })
        .then((res) => {
          if (res.status === 200) {
            addToast({
              timeout: 3000,
              shouldShowTimeoutProgress: true,
              title: "Registrazione effettuata con successo!",
              description:
                "Controlla la tua email per l'attivazione del tuo account",
              color: "success",
            });
          } else {
            addToast({
              timeout: 3000,
              shouldShowTimeoutProgress: true,
              title: "Errore durante la registrazione",
              description: "Controlla i dati inseriti e riprova",
              color: "danger",
            });
          }
        })
        .catch((err) => {
          console.error(err);
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante la registrazione",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        });
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setIsVisible(false);
    setIsConfirmVisible(false);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="relative overflow-hidden rounded-large bg-content1 shadow-large flex w-full max-w-md flex-col gap-4 px-8 pt-6 pb-10">
        {/* Container per l'animazione */}
        <div className="relative overflow-hidden">
          {/* Login Form */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              isLoginMode
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
            }`}
          >
            <div className="flex flex-col gap-1">
              <h1 className="text-large font-medium">Accedi al tuo account</h1>
              <p className="text-small text-default-500">
                per continuare su Acme
              </p>
            </div>

            <Form
              className="flex flex-col gap-3 mt-4"
              validationBehavior="native"
              onSubmit={handleSubmit}
            >
              <Input
                isRequired
                label="Indirizzo Email"
                name="email"
                placeholder="esempio@email.com"
                type="email"
                variant="bordered"
                value={formData.email}
                onChange={handleInputChange}
              />
              <Input
                isRequired
                endContent={
                  <button type="button" onClick={toggleVisibility}>
                    {isVisible ? (
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
                label="Password"
                name="password"
                placeholder="********"
                type={isVisible ? "text" : "password"}
                variant="bordered"
                value={formData.password}
                onChange={handleInputChange}
              />
              <div className="flex w-full items-center justify-between px-1 py-2">
                <Checkbox name="remember" size="sm">
                  Ricordami
                </Checkbox>
                <Link className="text-default-500" href="#" size="sm">
                  Password dimenticata?
                </Link>
              </div>
              <Button
                className="w-full hover:bg-gradient-to-br hover:from-primary hover:to-secondary hover:text-white"
                color="primary"
                variant="shadow"
                type="submit"
              >
                Accedi
              </Button>
            </Form>
          </div>

          {/* SignUp Form */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              !isLoginMode
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            }`}
          >
            <div className="flex flex-col gap-1">
              <h1 className="text-large font-medium">Crea un account</h1>
              <p className="text-small text-default-500">
                per iniziare con Acme
              </p>
            </div>

            <Form
              className="flex flex-col gap-3 mt-4"
              validationBehavior="native"
              onSubmit={handleSubmit}
            >
              <Input
                isRequired
                label="Nome"
                name="name"
                placeholder="Inserisci il tuo nome"
                type="text"
                variant="bordered"
                value={formData.name}
                onChange={handleInputChange}
                className={`transition-all duration-500 ease-in-out ${
                  isLoginMode
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
              />
              <Input
                isRequired
                label="Cognome"
                name="surname"
                placeholder="Inserisci il tuo cognome"
                type="text"
                variant="bordered"
                value={formData.surname}
                onChange={handleInputChange}
                className={`transition-all duration-500 ease-in-out ${
                  isLoginMode
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
              />
              <Input
                isRequired
                label="Indirizzo Email"
                name="email"
                placeholder="Inserisci la tua email"
                type="email"
                variant="bordered"
                value={formData.email}
                onChange={handleInputChange}
              />
              <Input
                isRequired
                label="ID Azienda"
                name="company_id"
                placeholder="Inserisci l'ID della tua azienda"
                type="number"
                variant="bordered"
                value={formData.company_id}
                onChange={handleInputChange}
                className={`transition-all duration-500 ease-in-out ${
                  isLoginMode
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
              />
              <Input
                isRequired
                endContent={
                  <button type="button" onClick={toggleVisibility}>
                    {isVisible ? (
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
                label="Password"
                name="password"
                placeholder="Inserisci la tua password"
                type={isVisible ? "text" : "password"}
                variant="bordered"
                value={formData.password}
                onChange={handleInputChange}
              />
              <Input
                isRequired
                endContent={
                  <button type="button" onClick={toggleConfirmVisibility}>
                    {isConfirmVisible ? (
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
                label="Conferma Password"
                name="confirm_password"
                placeholder="Conferma la tua password"
                type={isConfirmVisible ? "text" : "password"}
                variant="bordered"
                value={formData.confirm_password}
                onChange={handleInputChange}
                className={`transition-all duration-500 ease-in-out ${
                  isLoginMode
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
              />
              <Checkbox
                isRequired
                className={`py-4 transition-all duration-500 ease-in-out ${
                  isLoginMode
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
                size="sm"
              >
                Accetto i&nbsp;
                <Link className="relative z-1" href="#" size="sm">
                  Termini
                </Link>
                &nbsp;e la&nbsp;
                <Link className="relative z-1" href="#" size="sm">
                  Privacy Policy
                </Link>
              </Checkbox>
              <Button
                className={`w-full hover:bg-gradient-to-br hover:from-primary hover:to-secondary hover:text-white transition-all duration-500 ease-in-out ${
                  isLoginMode
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
                color="primary"
                variant="shadow"
                type="submit"
              >
                Registrati
              </Button>
            </Form>
          </div>
        </div>

        {/* Social Login Section */}
        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1" />
          <p className="text-tiny text-default-500 shrink-0">OPPURE</p>
          <Divider className="flex-1" />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            startContent={<Icon icon="flat-color-icons:google" width={24} />}
            variant="bordered"
          >
            Continua con Google
          </Button>
          <Button
            startContent={
              <Icon className="text-default-500" icon="fe:github" width={24} />
            }
            variant="bordered"
          >
            Continua con Github
          </Button>
        </div>

        {/* Switch Mode Button */}
        <div className="text-center">
          <Button
            variant="light"
            color="primary"
            size="sm"
            onClick={switchMode}
            className="transition-all duration-300 hover:bg-primary hover:text-white"
          >
            {isLoginMode ? (
              <>
                Non hai un account?&nbsp;
                <span className="font-semibold">Registrati</span>
              </>
            ) : (
              <>
                Hai già un account?&nbsp;
                <span className="font-semibold">Accedi</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
