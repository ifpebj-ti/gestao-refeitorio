"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  UtensilsCrossed,
  Sparkles,
  Edit2,
  UserX,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Mail,
  User as UserIcon,
  ShieldAlert,
  KeyRound,
  Trash2,
} from "lucide-react";
import {
  listarUsuarios,
  cadastrarUsuario,
  editarUsuario,
  desativarUsuario,
  definirSenhaUsuario,
  removerSenhaUsuario,
  UsuarioDTO,
  PerfilUsuario,
} from "@/lib/usuarios";

export default function GestaoUsuariosPage() {
  const router = useRouter();
  const { autenticado, carregando, perfil: perfilLogado, usuario: usuarioLogado } = useAuth();

  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState<string>("TODOS");
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");

  // Modais
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [modalDesativarAberto, setModalDesativarAberto] = useState(false);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [modalRemoverSenhaAberto, setModalRemoverSenhaAberto] = useState(false);

  // Estados dos formulários
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<UsuarioDTO | null>(null);
  const [usuarioParaDesativar, setUsuarioParaDesativar] = useState<UsuarioDTO | null>(null);
  const [usuarioParaSenha, setUsuarioParaSenha] = useState<UsuarioDTO | null>(null);
  const [usuarioParaRemoverSenha, setUsuarioParaRemoverSenha] = useState<UsuarioDTO | null>(null);

  const [formNome, setFormNome] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPerfil, setFormPerfil] = useState<PerfilUsuario>("NUTRICIONISTA");
  const [formSenhaCadastro, setFormSenhaCadastro] = useState("");
  const [formConfirmarSenhaCadastro, setFormConfirmarSenhaCadastro] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // Proteção de rota para ADMIN
  useEffect(() => {
    if (!carregando) {
      if (!autenticado) {
        router.push("/");
      } else if (perfilLogado !== "ADMIN") {
        router.push("/consumo");
      }
    }
  }, [autenticado, carregando, perfilLogado, router]);

  const carregarLista = useCallback(async () => {
    if (!autenticado || perfilLogado !== "ADMIN") return;
    setCarregandoDados(true);
    setErro(null);
    try {
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar lista de usuários.");
    } finally {
      setCarregandoDados(false);
    }
  }, [autenticado, perfilLogado]);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  if (carregando || !autenticado || perfilLogado !== "ADMIN") {
    return null;
  }

  // Cálculos de KPIs
  const totalUsuarios = usuarios.length;
  const totalAdmins = usuarios.filter((u) => u.perfil === "ADMIN").length;
  const totalNutris = usuarios.filter((u) => u.perfil === "NUTRICIONISTA").length;
  const totalCozinha = usuarios.filter((u) => u.perfil === "COZINHA").length;
  const totalAtivos = usuarios.filter((u) => u.ativo).length;

  // Filtragem
  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusca =
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase());
    const matchPerfil = filtroPerfil === "TODOS" || u.perfil === filtroPerfil;
    const matchStatus =
      filtroStatus === "TODOS" ||
      (filtroStatus === "ATIVOS" && u.ativo) ||
      (filtroStatus === "INATIVOS" && !u.ativo);
    return matchBusca && matchPerfil && matchStatus;
  });

  const abrirModalCadastro = () => {
    setFormNome("");
    setFormEmail("");
    setFormPerfil("NUTRICIONISTA");
    setFormSenhaCadastro("");
    setFormConfirmarSenhaCadastro("");
    setErroModal(null);
    setModalCadastroAberto(true);
  };

  const abrirModalEdicao = (u: UsuarioDTO) => {
    setUsuarioEmEdicao(u);
    setFormNome(u.nome);
    setFormPerfil(u.perfil);
    setErroModal(null);
    setModalEdicaoAberto(true);
  };

  const abrirModalDesativar = (u: UsuarioDTO) => {
    setUsuarioParaDesativar(u);
    setErro(null);
    setModalDesativarAberto(true);
  };

  const abrirModalSenha = (u: UsuarioDTO) => {
    setUsuarioParaSenha(u);
    setNovaSenha("");
    setConfirmarSenha("");
    setErroModal(null);
    setModalSenhaAberto(true);
  };

  const fecharModalSenha = () => {
    setModalSenhaAberto(false);
    setUsuarioParaSenha(null);
    setNovaSenha("");
    setConfirmarSenha("");
    setErroModal(null);
  };

  const abrirModalRemoverSenha = (u: UsuarioDTO) => {
    setUsuarioParaRemoverSenha(u);
    setErro(null);
    setModalRemoverSenhaAberto(true);
  };

  const handleDefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioParaSenha) return;

    if (novaSenha.length < 12) {
      setErroModal("A senha deve ter pelo menos 12 caracteres.");
      return;
    }

    const tamanhoBytes = new TextEncoder().encode(novaSenha).length;
    if (tamanhoBytes > 72) {
      setErroModal("A senha não pode ultrapassar 72 bytes.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErroModal("A confirmação de senha não confere.");
      return;
    }

    setSalvando(true);
    setErroModal(null);
    try {
      await definirSenhaUsuario(usuarioParaSenha.id, novaSenha);
      const nomeUsuario = usuarioParaSenha.nome;
      fecharModalSenha();
      setSucesso(`Senha local definida para "${nomeUsuario}" com sucesso!`);
      setTimeout(() => setSucesso(null), 4000);
      await carregarLista();
    } catch (err: unknown) {
      setErroModal(
        err instanceof Error ? err.message : "Erro ao definir senha do usuário."
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleRemoverSenha = async () => {
    if (!usuarioParaRemoverSenha) return;
    setSalvando(true);
    setErro(null);
    try {
      await removerSenhaUsuario(usuarioParaRemoverSenha.id);
      const nomeUsuario = usuarioParaRemoverSenha.nome;
      setModalRemoverSenhaAberto(false);
      setUsuarioParaRemoverSenha(null);
      setSucesso(`Senha local removida de "${nomeUsuario}" com sucesso!`);
      setTimeout(() => setSucesso(null), 4000);
      await carregarLista();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao remover senha do usuário."
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formEmail.trim()) {
      setErroModal("Preencha todos os campos obrigatórios.");
      return;
    }

    if (formSenhaCadastro.length > 0) {
      if (formSenhaCadastro.length < 12) {
        setErroModal("A senha opcional deve ter pelo menos 12 caracteres.");
        return;
      }
      const tamanhoBytes = new TextEncoder().encode(formSenhaCadastro).length;
      if (tamanhoBytes > 72) {
        setErroModal("A senha não pode ultrapassar 72 bytes.");
        return;
      }
      if (formSenhaCadastro !== formConfirmarSenhaCadastro) {
        setErroModal("A confirmação de senha não confere.");
        return;
      }
    }

    setSalvando(true);
    setErroModal(null);
    try {
      const novoUsuario = await cadastrarUsuario({
        nome: formNome.trim(),
        email: formEmail.trim().toLowerCase(),
        perfil: formPerfil,
      });

      if (formSenhaCadastro.length > 0) {
        await definirSenhaUsuario(novoUsuario.id, formSenhaCadastro);
      }

      setFormSenhaCadastro("");
      setFormConfirmarSenhaCadastro("");
      setModalCadastroAberto(false);
      setSucesso(
        formSenhaCadastro.length > 0
          ? `Usuário "${formNome}" cadastrado com senha local definida!`
          : `Usuário "${formNome}" cadastrado com sucesso!`
      );
      setTimeout(() => setSucesso(null), 4000);
      await carregarLista();
    } catch (err: unknown) {
      setErroModal(err instanceof Error ? err.message : "Erro ao cadastrar usuário.");
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEmEdicao) return;
    if (!formNome.trim()) {
      setErroModal("O nome é obrigatório.");
      return;
    }

    setSalvando(true);
    setErroModal(null);
    try {
      await editarUsuario(usuarioEmEdicao.id, {
        nome: formNome.trim(),
        perfil: formPerfil,
      });
      setModalEdicaoAberto(false);
      setSucesso(`Usuário "${formNome}" atualizado com sucesso!`);
      setTimeout(() => setSucesso(null), 4000);
      await carregarLista();
    } catch (err: unknown) {
      setErroModal(err instanceof Error ? err.message : "Erro ao atualizar usuário.");
    } finally {
      setSalvando(false);
    }
  };

  const handleDesativar = async () => {
    if (!usuarioParaDesativar) return;
    setSalvando(true);
    try {
      await desativarUsuario(usuarioParaDesativar.id);
      setModalDesativarAberto(false);
      setSucesso(`Usuário "${usuarioParaDesativar.nome}" desativado com sucesso!`);
      setTimeout(() => setSucesso(null), 4000);
      await carregarLista();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao desativar usuário.");
    } finally {
      setSalvando(false);
    }
  };

  const getPerfilBadge = (perfil: PerfilUsuario) => {
    switch (perfil) {
      case "ADMIN":
        return {
          label: "Admin",
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          icon: ShieldCheck,
          avatarBg: "bg-purple-600",
        };
      case "NUTRICIONISTA":
        return {
          label: "Nutri",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: Sparkles,
          avatarBg: "bg-emerald-600",
        };
      case "COZINHA":
        return {
          label: "Cozinha",
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: UtensilsCrossed,
          avatarBg: "bg-amber-600",
        };
      default:
        return {
          label: perfil,
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          icon: UserIcon,
          avatarBg: "bg-slate-600",
        };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-purple-600" />
            <span>Gestão de Usuários</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Controle de acesso e cadastro de contas institucionais para Cozinha, Nutricionistas e Administradores
          </p>
        </div>

        <button
          id="btn-novo-usuario"
          type="button"
          onClick={abrirModalCadastro}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* ALERTAS GERAIS */}
      {erro && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800 font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      {/* 2. CARDS DE KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-purple-200 transition-colors">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Total de Contas</span>
          </span>
          <p className="text-2xl font-black text-slate-800">{totalUsuarios}</p>
          <p className="text-[11px] text-slate-400">Contas institucionais</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-amber-200 transition-colors">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
            <span>Cozinha</span>
          </span>
          <p className="text-2xl font-black text-amber-900">{totalCozinha}</p>
          <p className="text-[11px] text-slate-400">Consumo diário e alertas</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-emerald-200 transition-colors">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nutricionistas</span>
          </span>
          <p className="text-2xl font-black text-emerald-900">{totalNutris}</p>
          <p className="text-[11px] text-slate-400">Estoque e relatórios</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-purple-200 transition-colors">
          <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administradores</span>
          </span>
          <p className="text-2xl font-black text-purple-900">{totalAdmins}</p>
          <p className="text-[11px] text-slate-400">Gestão e acessos TI</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-1 hover:border-emerald-200 transition-colors sm:col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Contas Ativas</span>
          </span>
          <p className="text-2xl font-black text-slate-900">
            {totalAtivos}{" "}
            <span className="text-sm font-normal text-slate-400">/ {totalUsuarios}</span>
          </p>
          <p className="text-[11px] text-slate-400">Acessos habilitados</p>
        </div>
      </div>

      {/* 3. BARRA DE PESQUISA E FILTROS */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-busca-usuarios"
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="filtro-perfil-usuarios"
            value={filtroPerfil}
            onChange={(e) => setFiltroPerfil(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="TODOS">Todos os Perfis</option>
            <option value="COZINHA">Cozinha</option>
            <option value="NUTRICIONISTA">Nutricionistas</option>
            <option value="ADMIN">Administradores</option>
          </select>

          <select
            id="filtro-status-usuarios"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ATIVOS">Ativos</option>
            <option value="INATIVOS">Inativos</option>
          </select>
        </div>
      </div>

      {/* 4. TABELA DE USUÁRIOS */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {carregandoDados ? (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-400 font-medium text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            <span>Carregando usuários...</span>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Nenhum usuário encontrado</p>
            <p className="text-xs text-slate-400">
              Tente ajustar os filtros ou cadastre um novo usuário.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap">Usuário</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Perfil</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Senha</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Cadastrado em</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Gerenciar Senha</th>
                  <th className="px-5 py-3.5 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {usuariosFiltrados.map((u) => {
                  const badge = getPerfilBadge(u.perfil);
                  const Icon = badge.icon;
                  const dataCriacao = u.criadoEm
                    ? new Date(u.criadoEm).toLocaleDateString("pt-BR")
                    : "—";
                  const isMeuUsuario = usuarioLogado?.email === u.email;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full text-white font-black text-xs flex items-center justify-center shrink-0 ${badge.avatarBg} shadow-2xs`}
                          >
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{u.nome}</span>
                              {isMeuUsuario && (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                                  Você
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{u.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.bg}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            u.ativo
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.ativo ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          <span>{u.ativo ? "Ativo" : "Inativo"}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {u.possuiSenhaLocal ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <KeyRound className="w-3.5 h-3.5 shrink-0" />
                            <span>Sim</span>
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">
                            Não
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                        {dataCriacao}
                      </td>

                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => abrirModalSenha(u)}
                          className="w-[118px] inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer shrink-0"
                          title={u.possuiSenhaLocal ? "Redefinir ou remover senha local" : "Definir senha local"}
                        >
                          <KeyRound className="w-3.5 h-3.5 shrink-0" />
                          <span>{u.possuiSenhaLocal ? "Redefinir senha" : "Definir senha"}</span>
                        </button>
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <div className="w-7 h-7 flex items-center justify-center shrink-0">
                            <button
                              type="button"
                              onClick={() => abrirModalEdicao(u)}
                              className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar usuário"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="w-7 h-7 flex items-center justify-center shrink-0">
                            {u.ativo && !isMeuUsuario && (
                              <button
                                type="button"
                                onClick={() => abrirModalDesativar(u)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Desativar usuário"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL DE CADASTRO ────────────────────────────────────────────── */}
      {modalCadastroAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Novo Usuário</h3>
                  <p className="text-xs text-slate-400">Cadastre um novo usuário no sistema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCadastroAberto(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroModal && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroModal}</span>
              </div>
            )}

            <form onSubmit={handleCadastrar} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Juliana Menezes"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  placeholder="exemplo@gmail.com ou @ifpe.edu.br"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-400">
                  O usuário usará este e-mail para autenticar via Google ou com senha local.
                </p>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Senha Local</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-md">
                        Opcional
                      </span>
                    </label>
                    {formSenhaCadastro.length > 0 && (
                      <span className="text-[11px] text-slate-400">
                        {formSenhaCadastro.length}/12 caracteres
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mínimo de 12 caracteres"
                    value={formSenhaCadastro}
                    onChange={(e) => {
                      setFormSenhaCadastro(e.target.value);
                      if (!e.target.value) setFormConfirmarSenhaCadastro("");
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {formSenhaCadastro.length > 0 && (
                  <div className="space-y-1 animate-in fade-in duration-150">
                    <label className="text-xs font-bold text-slate-700">
                      Confirmar Senha *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={12}
                      autoComplete="new-password"
                      placeholder="Repita a senha (mínimo de 12 caracteres)"
                      value={formConfirmarSenhaCadastro}
                      onChange={(e) => setFormConfirmarSenhaCadastro(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Perfil de Acesso *</label>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formPerfil === "COZINHA"
                        ? "border-amber-500 bg-amber-50/50 shadow-2xs"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="perfil"
                      value="COZINHA"
                      checked={formPerfil === "COZINHA"}
                      onChange={() => setFormPerfil("COZINHA")}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Cozinha
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Lançamento diário de insumos consumidos e acompanhamento de alertas.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formPerfil === "NUTRICIONISTA"
                        ? "border-emerald-500 bg-emerald-50/50 shadow-2xs"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="perfil"
                      value="NUTRICIONISTA"
                      checked={formPerfil === "NUTRICIONISTA"}
                      onChange={() => setFormPerfil("NUTRICIONISTA")}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Nutricionista
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Acesso a estoque, cardápio, relatórios consolidados e auditoria.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formPerfil === "ADMIN"
                        ? "border-purple-500 bg-purple-50/50 shadow-2xs"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="perfil"
                      value="ADMIN"
                      checked={formPerfil === "ADMIN"}
                      onChange={() => setFormPerfil("ADMIN")}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Administrador (TI / Gestão de Acessos)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Gestão exclusiva de cadastro, edição e desativação de contas.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCadastroAberto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Salvar Usuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL DE EDIÇÃO ─────────────────────────────────────────────── */}
      {modalEdicaoAberto && usuarioEmEdicao && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Editar Usuário</h3>
                  <p className="text-xs text-slate-400">{usuarioEmEdicao.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEdicaoAberto(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroModal && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroModal}</span>
              </div>
            )}

            <form onSubmit={handleEditar} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Perfil de Acesso *</label>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formPerfil === "COZINHA"
                        ? "border-amber-500 bg-amber-50/50 shadow-2xs"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="perfil-edit"
                      value="COZINHA"
                      checked={formPerfil === "COZINHA"}
                      onChange={() => setFormPerfil("COZINHA")}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Cozinha
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Lançamento diário de insumos consumidos e acompanhamento de alertas.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formPerfil === "NUTRICIONISTA"
                        ? "border-emerald-500 bg-emerald-50/50 shadow-2xs"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="perfil-edit"
                      value="NUTRICIONISTA"
                      checked={formPerfil === "NUTRICIONISTA"}
                      onChange={() => setFormPerfil("NUTRICIONISTA")}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Nutricionista
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Acesso a estoque, cardápio, relatórios consolidados e auditoria.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formPerfil === "ADMIN"
                        ? "border-purple-500 bg-purple-50/50 shadow-2xs"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="perfil-edit"
                      value="ADMIN"
                      checked={formPerfil === "ADMIN"}
                      onChange={() => setFormPerfil("ADMIN")}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Administrador (TI / Gestão de Acessos)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Gestão exclusiva de cadastro, edição e desativação de contas.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEdicaoAberto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL DE CONFIRMAÇÃO DE DESATIVAÇÃO ────────────────────────── */}
      {modalDesativarAberto && usuarioParaDesativar && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Desativar Usuário</h3>
                <p className="text-xs text-slate-400">Esta ação revogará o acesso</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja desativar a conta de{" "}
              <strong className="text-slate-900">{usuarioParaDesativar.nome}</strong> (
              <span className="text-slate-500">{usuarioParaDesativar.email}</span>)? O usuário não
              conseguirá mais autenticar no sistema.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalDesativarAberto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDesativar}
                disabled={salvando}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Desativação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE DEFINIR / REDEFINIR SENHA LOCAL ─────────────────────── */}
      {modalSenhaAberto && usuarioParaSenha && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {usuarioParaSenha.possuiSenhaLocal ? "Redefinir Senha Local" : "Definir Senha Local"}
                  </h3>
                  <p className="text-xs text-slate-400">{usuarioParaSenha.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={fecharModalSenha}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {erroModal && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erroModal}</span>
              </div>
            )}

            <form onSubmit={handleDefinirSenha} autoComplete="off" className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                Defina uma senha para que <strong className="text-slate-800">{usuarioParaSenha.nome}</strong> possa entrar com e-mail e senha. A senha deve ter <strong>no mínimo 12 caracteres</strong>.
              </div>

              <div className="space-y-1">
                <label htmlFor="input-nova-senha" className="text-xs font-bold text-slate-700">
                  Nova Senha *
                </label>
                <input
                  id="input-nova-senha"
                  type="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  placeholder="Mínimo de 12 caracteres"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-400">
                  Mínimo de 12 caracteres ({novaSenha.length}/12).
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="input-confirmar-senha" className="text-xs font-bold text-slate-700">
                  Confirmar Senha *
                </label>
                <input
                  id="input-confirmar-senha"
                  type="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div>
                  {usuarioParaSenha.possuiSenhaLocal && (
                    <button
                      type="button"
                      onClick={() => {
                        const alvo = usuarioParaSenha;
                        fecharModalSenha();
                        abrirModalRemoverSenha(alvo);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover senha</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fecharModalSenha}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Salvar Senha</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL DE CONFIRMAÇÃO DE REMOÇÃO DE SENHA ────────────────────── */}
      {modalRemoverSenhaAberto && usuarioParaRemoverSenha && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Remover Senha Local</h3>
                <p className="text-xs text-slate-400">Desabilitar login por senha</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja remover a senha local de{" "}
              <strong className="text-slate-900">{usuarioParaRemoverSenha.nome}</strong> (
              <span className="text-slate-500">{usuarioParaRemoverSenha.email}</span>)? O usuário
              continuará podendo acessar apenas via conta Google.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalRemoverSenhaAberto(false);
                  setUsuarioParaRemoverSenha(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRemoverSenha}
                disabled={salvando}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Remover Senha</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
