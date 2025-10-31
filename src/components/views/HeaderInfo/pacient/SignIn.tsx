// SignIn.tsx - Versão corrigida
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Header from "../Header";
import Link from "next/link";

interface ValidationErrors {
  email?: string;
  password?: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPaciente() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const validateEmail = (email: string): string | undefined => {
    if (!email) return "E-mail ou CPF é obrigatório";

    if (email.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return "E-mail inválido";
    } else {
      const cleanCPF = email.replace(/\D/g, "");
      if (cleanCPF.length !== 11) return "CPF deve ter 11 dígitos";
      if (/^(\d)\1{10}$/.test(cleanCPF)) return "CPF inválido";
    }
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Senha é obrigatória";
    if (password.length < 6) return "Senha deve ter pelo menos 6 caracteres";
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "email":
        return validateEmail(value);
      case "password":
        return validatePassword(value);
      default:
        return undefined;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLoginError("");

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // No handleSubmit do SignIn.tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setLoginError("");

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      console.log("🔄 Iniciando signIn...");
      const result = await signIn("credentials", {
        login: formData.email,
        password: formData.password,
        redirect: false,
      });

      console.log("📊 Resultado signIn:", result);

      if (result?.error) {
        console.log("❌ Erro no signIn:", result.error);
        setLoginError(
          "Credenciais inválidas. Verifique seu e-mail/CPF e senha."
        );
      } else {
        console.log("✅ SignIn bem-sucedido, redirecionando...");
        router.push("/pacient/dashboard");
      }
    } catch (error) {
      console.error("🚨 Erro no login:", error);
      setLoginError("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    !errors.email && !errors.password && formData.email && formData.password;

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 w-full">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-linear-to-r from-blue-600 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Login do Paciente
                </h1>
                <p className="text-gray-600">
                  Acesse sua conta para acompanhar sua saúde
                </p>
              </div>

              {loginError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center text-red-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">{loginError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail ou CPF
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="seu@email.com ou 000.000.000-00"
                      className={`w-full pl-12 pr-10 py-3 bg-gray-50 border rounded-xl text-black focus:outline-none transition-all duration-200 ${
                        errors.email
                          ? "border-red-500 focus:ring-2 focus:ring-red-500"
                          : touched.email && !errors.email
                          ? "border-green-500 focus:ring-2 focus:ring-green-500"
                          : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {errors.email ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : touched.email && !errors.email ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : null}
                    </div>
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      placeholder="Sua senha"
                      className={`w-full pl-12 pr-12 py-3 bg-gray-50 border text-black rounded-xl focus:outline-none transition-all duration-200 ${
                        errors.password
                          ? "border-red-500 focus:ring-2 focus:ring-red-500"
                          : touched.password && !errors.password
                          ? "border-green-500 focus:ring-2 focus:ring-green-500"
                          : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {errors.password ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : touched.password && !errors.password ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : null}
                    </div>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className={`w-full py-4 px-6 rounded-xl font-semibold shadow-lg transform transition-all duration-200 ${
                      isFormValid && !isSubmitting
                        ? "cursor-pointer bg-linear-to-r from-blue-600 to-teal-500 text-white hover:shadow-xl hover:-translate-y-0.5"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Entrando...
                      </div>
                    ) : (
                      "Entrar como Paciente"
                    )}
                  </button>
                }
                {/* <Link href="/pacient/dashboard">
                  <button className="w-full py-4 px-6 rounded-xl font-semibold shadow-lg transform transition-all duration-200 cursor-pointer bg-linear-to-r from-blue-600 to-teal-500 text-white hover:shadow-xl hover:-translate-y-0.5 bg-gray-300 ">
                    Entrar
                  </button>
                </Link> */}
                <div className="text-center space-y-3">
                  <Link href="/esqueci-senha">
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 block w-full"
                    >
                      Esqueceu sua senha?
                    </button>
                  </Link>

                  <div className="text-sm text-gray-600">
                    Não tem uma conta?{" "}
                    <Link href="/pacient/register">
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                      >
                        Cadastre-se
                      </button>
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
