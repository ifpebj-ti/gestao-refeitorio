"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  Plus,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Paperclip,
  Download,
  Printer,
  Edit2,
  Eye,
  AlertCircle,
  X,
  Upload,
  Power,
  RotateCcw,
  Search,
  FileText,
} from "lucide-react";
import {
  listarNotas,
  buscarNotaPorId,
  listarEntradasDisponiveisNota,
  registrarNota,
  emitirNotaLocal,
  editarNotaPendente,
  validarNota,
  cancelarNota,
  anexarDocumentoNota,
  baixarDocumentoNota,
  NotaResumoDTO,
  NotaResponseDTO,
  NotaEntradaDTO,
  StatusNota,
  TipoNota,
} from "@/lib/notas";
import {
  listarRemetentes,
  cadastrarRemetente,
  editarRemetente,
  inativarRemetente,
  reativarRemetente,
  RemetenteDTO,
} from "@/lib/remetentes";

type AbaAtiva = "NOTAS" | "REMETENTES";

function validarDocumentoCpfCnpj(doc: string): boolean {
  const limpo = doc.replace(/\D/g, "");
  if (limpo.length === 0) return true;
  return limpo.length === 11 || limpo.length === 14;
}

export default function GestaoNotasPage() {
  const router = useRouter();
  const { autenticado, carregando, perfil } = useAuth();

  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("NOTAS");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(false);

  // ── Estados de Notas ──
  const [notas, setNotas] = useState<NotaResumoDTO[]>([]);
  const [notasContagem, setNotasContagem] = useState<NotaResumoDTO[]>([]);
  const [filtroStatusNota, setFiltroStatusNota] = useState<StatusNota | "">("");
  const [filtroTipoNota, setFiltroTipoNota] = useState<TipoNota | "">("");
  const [filtroRemetenteId, setFiltroRemetenteId] = useState<string>("");
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>("");
  const [filtroDataFim, setFiltroDataFim] = useState<string>("");

  // ── Estados de Remetentes ──
  const [remetentes, setRemetentes] = useState<RemetenteDTO[]>([]);
  const [filtroAtivoRemetente, setFiltroAtivoRemetente] = useState<string>("TODOS");
  const [buscaRemetente, setBuscaRemetente] = useState<string>("");

  // ── Modais de Nota (Criar Externa / Editar Pendente / Emitir Local / Detalhe / Cancelar) ──
  const [modalNotaAberto, setModalNotaAberto] = useState(false);
  const [modoModalNota, setModoModalNota] = useState<"EXTERNA" | "LOCAL" | "EDITAR">("EXTERNA");
  const [notaEmEdicaoId, setNotaEmEdicaoId] = useState<string | null>(null);
  const [entradasDisponiveis, setEntradasDisponiveis] = useState<NotaEntradaDTO[]>([]);
  const [formNumeroNota, setFormNumeroNota] = useState("");
  const [formDataNota, setFormDataNota] = useState(() => new Date().toISOString().split("T")[0]);
  const [formRemetenteNotaId, setFormRemetenteNotaId] = useState("");
  const [formResponsavelEntrega, setFormResponsavelEntrega] = useState("");
  const [formObservacoesNota, setFormObservacoesNota] = useState("");
  const [formMovimentacaoIds, setFormMovimentacaoIds] = useState<string[]>([]);
  const [formArquivoNota, setFormArquivoNota] = useState<File | null>(null);

  const [notaDetalhe, setNotaDetalhe] = useState<NotaResponseDTO | null>(null);
  const [exibindoComprovanteImpressao, setExibindoComprovanteImpressao] = useState(false);
  const [modalCancelarNotaAberto, setModalCancelarNotaAberto] = useState(false);
  const [justificativaCancelamento, setJustificativaCancelamento] = useState("");

  // ── Modal de Remetente (Criar / Editar) ──
  const [modalRemetenteAberto, setModalRemetenteAberto] = useState(false);
  const [remetenteEmEdicao, setRemetenteEmEdicao] = useState<RemetenteDTO | null>(null);
  const [formNomeRemetente, setFormNomeRemetente] = useState("");
  const [formDocRemetente, setFormDocRemetente] = useState("");
  const [formContatoRemetente, setFormContatoRemetente] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // Proteção de rota exclusiva para NUTRICIONISTA
  useEffect(() => {
    if (!carregando) {
      if (!autenticado) {
        router.push("/");
      } else if (perfil === "ADMIN") {
        router.push("/usuarios");
      } else if (perfil === "COZINHA") {
        router.push("/consumo");
      }
    }
  }, [autenticado, carregando, perfil, router]);

  const carregarDados = useCallback(async () => {
    if (!autenticado || perfil !== "NUTRICIONISTA") return;
    setCarregandoDados(true);
    setErro(null);
    try {
      const ativoParam =
        filtroAtivoRemetente === "ATIVOS"
          ? true
          : filtroAtivoRemetente === "INATIVOS"
          ? false
          : undefined;

      const filtrosSemStatus = {
        tipo: filtroTipoNota,
        remetenteId: filtroRemetenteId || undefined,
        dataInicio: filtroDataInicio || undefined,
        dataFim: filtroDataFim || undefined,
      };

      const [listaNotas, listaTodasStatus, listaRemetentes] = await Promise.all([
        listarNotas({
          status: filtroStatusNota,
          ...filtrosSemStatus,
        }),
        filtroStatusNota
          ? listarNotas(filtrosSemStatus)
          : Promise.resolve<NotaResumoDTO[] | null>(null),
        listarRemetentes(ativoParam),
      ]);
      setNotas(listaNotas);
      setNotasContagem(listaTodasStatus ?? listaNotas);
      setRemetentes(listaRemetentes);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar dados de notas e remetentes.");
    } finally {
      setCarregandoDados(false);
    }
  }, [
    autenticado,
    perfil,
    filtroStatusNota,
    filtroTipoNota,
    filtroRemetenteId,
    filtroDataInicio,
    filtroDataFim,
    filtroAtivoRemetente,
  ]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (carregando || !autenticado || perfil !== "NUTRICIONISTA") {
    return null;
  }

  const remetentesAtivos = remetentes.filter((r) => r.ativo);

  // ── Handlers de Nota (US27, US28, US29, US30, US33) ──

  const abrirModalNovaNota = async (modo: "EXTERNA" | "LOCAL") => {
    setErroModal(null);
    setModoModalNota(modo);
    setNotaEmEdicaoId(null);
    setFormNumeroNota("");
    setFormDataNota(new Date().toISOString().split("T")[0]);
    setFormRemetenteNotaId(remetentesAtivos[0]?.id || "");
    setFormResponsavelEntrega("");
    setFormObservacoesNota("");
    setFormMovimentacaoIds([]);
    setFormArquivoNota(null);
    setModalNotaAberto(true);

    try {
      const entradas = await listarEntradasDisponiveisNota();
      setEntradasDisponiveis(entradas);
    } catch (e: unknown) {
      setErroModal(e instanceof Error ? e.message : "Erro ao carregar entradas disponíveis.");
    }
  };

  const abrirModalEditarNota = async (nota: NotaResponseDTO) => {
    setErroModal(null);
    setModoModalNota("EDITAR");
    setNotaEmEdicaoId(nota.id);
    setFormNumeroNota(nota.numero);
    setFormDataNota(nota.data);
    setFormRemetenteNotaId(nota.remetente.id);
    setFormObservacoesNota(nota.observacoes || "");
    const idsAtuais = nota.entradas.map((e) => e.movimentacaoId);
    setFormMovimentacaoIds(idsAtuais);
    setFormArquivoNota(null);
    setModalNotaAberto(true);

    try {
      const livres = await listarEntradasDisponiveisNota();
      const combinadas = [
        ...nota.entradas,
        ...livres.filter((l) => !idsAtuais.includes(l.movimentacaoId)),
      ];
      setEntradasDisponiveis(combinadas);
    } catch {
      setEntradasDisponiveis(nota.entradas);
    }
  };

  const alternarSelecaoEntrada = (movId: string) => {
    setFormMovimentacaoIds((prev) =>
      prev.includes(movId) ? prev.filter((id) => id !== movId) : [...prev, movId]
    );
  };

  const handleSalvarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal(null);

    if (!formRemetenteNotaId) {
      setErroModal("Selecione um remetente.");
      return;
    }
    if (formMovimentacaoIds.length === 0) {
      setErroModal("Selecione ao menos uma entrada de estoque para vincular à nota.");
      return;
    }

    setSalvando(true);
    try {
      let notaSalva: NotaResponseDTO;

      if (modoModalNota === "LOCAL") {
        if (!formResponsavelEntrega.trim()) {
          setErroModal("Informe o nome do responsável pela entrega.");
          setSalvando(false);
          return;
        }
        notaSalva = await emitirNotaLocal({
          data: formDataNota,
          remetenteId: formRemetenteNotaId,
          movimentacaoIds: formMovimentacaoIds,
          responsavelEntrega: formResponsavelEntrega.trim(),
          observacoes: formObservacoesNota.trim() || undefined,
        });
        setSucesso(`Nota local ${notaSalva.numero} emitida com sucesso!`);
      } else if (modoModalNota === "EDITAR" && notaEmEdicaoId) {
        if (!formNumeroNota.trim()) {
          setErroModal("Informe o número da nota.");
          setSalvando(false);
          return;
        }
        notaSalva = await editarNotaPendente(notaEmEdicaoId, {
          numero: formNumeroNota.trim(),
          data: formDataNota,
          remetenteId: formRemetenteNotaId,
          movimentacaoIds: formMovimentacaoIds,
          observacoes: formObservacoesNota.trim() || undefined,
        });
        setNotaDetalhe(notaSalva);
        setSucesso(`Nota ${notaSalva.numero} atualizada com sucesso!`);
      } else {
        if (!formNumeroNota.trim()) {
          setErroModal("Informe o número da nota.");
          setSalvando(false);
          return;
        }
        notaSalva = await registrarNota({
          numero: formNumeroNota.trim(),
          data: formDataNota,
          remetenteId: formRemetenteNotaId,
          movimentacaoIds: formMovimentacaoIds,
          observacoes: formObservacoesNota.trim() || undefined,
        });
        setSucesso(`Nota ${notaSalva.numero} registrada com status Pendente!`);
      }

      if (modoModalNota === "EXTERNA" && formArquivoNota && notaSalva?.id) {
        await anexarDocumentoNota(notaSalva.id, formArquivoNota);
        notaSalva = { ...notaSalva, possuiDocumento: true };
      }

      setModalNotaAberto(false);
      if (modoModalNota === "LOCAL") {
        setNotaDetalhe(notaSalva);
        setExibindoComprovanteImpressao(true);
      }
      await carregarDados();
    } catch (err: unknown) {
      setErroModal(err instanceof Error ? err.message : "Erro ao salvar nota.");
    } finally {
      setSalvando(false);
    }
  };

  const handleAbrirDetalheNota = async (id: string) => {
    setErro(null);
    setExibindoComprovanteImpressao(false);
    try {
      const detalhe = await buscarNotaPorId(id);
      setNotaDetalhe(detalhe);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar detalhes da nota.");
    }
  };

  const handleValidarNota = async (id: string) => {
    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await validarNota(id);
      setNotaDetalhe(atualizada);
      setSucesso(`Nota ${atualizada.numero} validada com sucesso!`);
      await carregarDados();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao validar nota.");
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarCancelamentoNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaDetalhe) return;
    if (!justificativaCancelamento.trim()) {
      setErroModal("A justificativa é obrigatória para cancelar a nota.");
      return;
    }

    setSalvando(true);
    setErroModal(null);
    try {
      const atualizada = await cancelarNota(
        notaDetalhe.id,
        justificativaCancelamento.trim()
      );
      setNotaDetalhe(atualizada);
      setModalCancelarNotaAberto(false);
      setJustificativaCancelamento("");
      setSucesso(`Nota ${atualizada.numero} cancelada.`);
      await carregarDados();
    } catch (err: unknown) {
      setErroModal(err instanceof Error ? err.message : "Erro ao cancelar nota.");
    } finally {
      setSalvando(false);
    }
  };

  const handleUploadDocumentoDetalhe = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !notaDetalhe) return;
    setErro(null);
    try {
      await anexarDocumentoNota(notaDetalhe.id, file);
      const atualizada = await buscarNotaPorId(notaDetalhe.id);
      setNotaDetalhe(atualizada);
      setSucesso("Documento anexado à nota com sucesso!");
      await carregarDados();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao anexar documento.");
    }
  };

  const handleBaixarDocumento = async (nota: NotaResponseDTO) => {
    setErro(null);
    try {
      const { blob, contentType } = await baixarDocumentoNota(nota.id);
      const ext = contentType.includes("png")
        ? "png"
        : contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : "pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nota-${nota.numero}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao baixar documento.");
    }
  };

  // ── Handlers de Remetente (US26) ──

  const abrirModalNovoRemetente = () => {
    setErroModal(null);
    setRemetenteEmEdicao(null);
    setFormNomeRemetente("");
    setFormDocRemetente("");
    setFormContatoRemetente("");
    setModalRemetenteAberto(true);
  };

  const abrirModalEditarRemetente = (rem: RemetenteDTO) => {
    setErroModal(null);
    setRemetenteEmEdicao(rem);
    setFormNomeRemetente(rem.nome);
    setFormDocRemetente(rem.documento || "");
    setFormContatoRemetente(rem.contato || "");
    setModalRemetenteAberto(true);
  };

  const handleSalvarRemetente = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal(null);

    if (!formNomeRemetente.trim()) {
      setErroModal("O nome do remetente é obrigatório.");
      return;
    }
    if (!validarDocumentoCpfCnpj(formDocRemetente)) {
      setErroModal("O documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos).");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: formNomeRemetente.trim(),
        documento: formDocRemetente.trim() || undefined,
        contato: formContatoRemetente.trim() || undefined,
      };

      if (remetenteEmEdicao) {
        await editarRemetente(remetenteEmEdicao.id, payload);
        setSucesso("Remetente atualizado com sucesso!");
      } else {
        await cadastrarRemetente(payload);
        setSucesso("Remetente cadastrado com sucesso!");
      }

      setModalRemetenteAberto(false);
      await carregarDados();
    } catch (err: unknown) {
      setErroModal(err instanceof Error ? err.message : "Erro ao salvar remetente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleAlternarStatusRemetente = async (rem: RemetenteDTO) => {
    setErro(null);
    try {
      if (rem.ativo) {
        await inativarRemetente(rem.id);
        setSucesso(`Remetente "${rem.nome}" inativado.`);
      } else {
        await reativarRemetente(rem.id);
        setSucesso(`Remetente "${rem.nome}" reativado.`);
      }
      await carregarDados();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao alterar status do remetente.");
    }
  };

  // KPIs de Notas (sempre contabilizam o total geral e o total de cada categoria, mesmo quando um card/status está selecionado)
  const baseContagem =
    notasContagem.length > 0 || filtroStatusNota === "" ? notasContagem : notas;
  const totalNotas = baseContagem.length;
  const totalPendentes = baseContagem.filter((n) => n.status === "PENDENTE").length;
  const totalValidadas = baseContagem.filter((n) => n.status === "VALIDADA").length;
  const totalCanceladas = baseContagem.filter((n) => n.status === "CANCELADA").length;

  const remetentesFiltrados = remetentes.filter(
    (r) =>
      r.nome.toLowerCase().includes(buscaRemetente.toLowerCase()) ||
      (r.documento || "").includes(buscaRemetente)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 pb-28">
      {/* 1. CABEÇALHO PADRONIZADO */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestão de Notas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {totalNotas} notas registradas • {totalPendentes} aguardando conferência • {remetentesAtivos.length} remetentes ativos
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {abaAtiva === "NOTAS" ? (
            <>
              <button
                type="button"
                onClick={() => abrirModalNovaNota("EXTERNA")}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar</span>
              </button>
              <button
                type="button"
                onClick={() => abrirModalNovaNota("LOCAL")}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                <span>Emitir</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={abrirModalNovoRemetente}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Remetente</span>
            </button>
          )}
        </div>
      </div>

      {/* Alertas de Feedback */}
      {erro && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
          <button type="button" onClick={() => setErro(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {sucesso && (
        <div className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sucesso}</span>
          </div>
          <button type="button" onClick={() => setSucesso(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. ABAS PADRONIZADAS (Mesmo estilo de Entradas & Estoque) */}
      <div className="no-print flex items-center gap-6 border-b border-slate-200 text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => setAbaAtiva("NOTAS")}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
            abaAtiva === "NOTAS"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Notas de Recebimento ({totalNotas})
        </button>
        <button
          type="button"
          onClick={() => setAbaAtiva("REMETENTES")}
          className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
            abaAtiva === "REMETENTES"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Remetentes ({remetentes.length})
        </button>
      </div>

      {/* ===================================================================== */}
      {/* ABA 1: NOTAS DE RECEBIMENTO                                           */}
      {/* ===================================================================== */}
      {abaAtiva === "NOTAS" && (
        <div className="no-print space-y-5">
          {/* Cards de Resumo no mesmo padrão da Central de Alertas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setFiltroStatusNota("")}
              className={`text-left bg-white border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer ${
                filtroStatusNota === ""
                  ? "border-slate-900 ring-2 ring-slate-900/10"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total</span>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{totalNotas}</p>
              <span className="text-[11px] text-slate-400">notas registradas</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroStatusNota("PENDENTE")}
              className={`text-left bg-white border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer ${
                filtroStatusNota === "PENDENTE"
                  ? "border-amber-600 ring-2 ring-amber-600/10"
                  : "border-amber-100 hover:border-amber-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">Pendentes</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-700 mt-2">{totalPendentes}</p>
              <span className="text-[11px] text-amber-600/70">aguardando validação</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroStatusNota("VALIDADA")}
              className={`text-left bg-white border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer ${
                filtroStatusNota === "VALIDADA"
                  ? "border-emerald-600 ring-2 ring-emerald-600/10"
                  : "border-emerald-100 hover:border-emerald-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Validadas</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-2">{totalValidadas}</p>
              <span className="text-[11px] text-emerald-600/70">conferidas</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroStatusNota("CANCELADA")}
              className={`text-left bg-white border rounded-2xl p-4 shadow-2xs transition-all cursor-pointer ${
                filtroStatusNota === "CANCELADA"
                  ? "border-rose-600 ring-2 ring-rose-600/10"
                  : "border-rose-100 hover:border-rose-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">Canceladas</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-rose-700 mt-2">{totalCanceladas}</p>
              <span className="text-[11px] text-rose-600/70">recusadas</span>
            </button>
          </div>

          {/* Barra de Filtros Compacta e Responsiva (US30 / #419) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Status
              </label>
              <select
                aria-label="Filtrar por status da nota"
                value={filtroStatusNota}
                onChange={(e) => setFiltroStatusNota(e.target.value as StatusNota | "")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
              >
                <option value="">Todos os Status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="VALIDADA">Validada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Tipo de Nota
              </label>
              <select
                aria-label="Filtrar por tipo da nota"
                value={filtroTipoNota}
                onChange={(e) => setFiltroTipoNota(e.target.value as TipoNota | "")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
              >
                <option value="">Todos os Tipos</option>
                <option value="EXTERNA">Externa</option>
                <option value="LOCAL">Local (Interna)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Remetente
              </label>
              <select
                aria-label="Filtrar por remetente"
                value={filtroRemetenteId}
                onChange={(e) => setFiltroRemetenteId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
              >
                <option value="">Todos os Remetentes</option>
                {remetentes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                aria-label="Data inicial"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Data Final
              </label>
              <input
                type="date"
                aria-label="Data final"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Tabela de Notas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
            <table className="w-full table-fixed text-center border-collapse min-w-[760px]">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-4 text-center">Número</th>
                  <th className="py-3.5 px-3 text-center">Tipo</th>
                  <th className="py-3.5 px-3 text-center">Data</th>
                  <th className="py-3.5 px-3 text-center">Remetente</th>
                  <th className="py-3.5 px-3 text-center">Entradas</th>
                  <th className="py-3.5 px-3 text-center">Anexo</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {notas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 text-xs sm:text-sm">
                      {carregandoDados
                        ? "Carregando notas..."
                        : "Nenhuma nota encontrada para os filtros selecionados."}
                    </td>
                  </tr>
                ) : (
                  notas.map((nota) => (
                    <tr key={nota.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 pl-6 pr-3 font-bold text-slate-900 text-left align-middle whitespace-nowrap truncate">
                        {nota.numero}
                      </td>
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                            nota.tipo === "LOCAL"
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {nota.tipo === "LOCAL" ? "Local" : "Externa"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 text-center align-middle whitespace-nowrap">
                        {nota.data}
                      </td>
                      <td className="py-3.5 px-3 text-center align-middle">
                        <div className="font-semibold text-slate-800 truncate">
                          {nota.remetenteNome}
                        </div>
                        {nota.responsavelEntrega && (
                          <div className="text-[11px] text-slate-400 truncate">
                            Entregue por: {nota.responsavelEntrega}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700 text-center align-middle whitespace-nowrap">
                        {nota.quantidadeEntradas}
                      </td>
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        {nota.possuiDocumento ? (
                          <span className="inline-flex items-center justify-center gap-1 text-emerald-700 font-semibold text-xs">
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Sim</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Não</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            nota.status === "VALIDADA"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : nota.status === "CANCELADA"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {nota.status === "VALIDADA" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : nota.status === "CANCELADA" ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{nota.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleAbrirDetalheNota(nota.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 2: REMETENTES (US26 / #415)                                       */}
      {/* ===================================================================== */}
      {abaAtiva === "REMETENTES" && (
        <div className="no-print space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar remetente por nome ou CPF/CNPJ..."
                value={buscaRemetente}
                onChange={(e) => setBuscaRemetente(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600"
              />
            </div>

            <select
              aria-label="Filtrar status de remetentes"
              value={filtroAtivoRemetente}
              onChange={(e) => setFiltroAtivoRemetente(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700"
            >
              <option value="TODOS">Todos os Remetentes</option>
              <option value="ATIVOS">Somente Ativos</option>
              <option value="INATIVOS">Somente Inativos</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
            <table className="w-full table-fixed text-center border-collapse min-w-[640px]">
              <colgroup>
                <col className="w-[26%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3.5 px-3 text-center">Nome</th>
                  <th className="py-3.5 px-3 text-center">CPF / CNPJ</th>
                  <th className="py-3.5 px-3 text-center">Contato</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {remetentesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      Nenhum remetente encontrado.
                    </td>
                  </tr>
                ) : (
                  remetentesFiltrados.map((rem) => (
                    <tr key={rem.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-900 text-center align-middle">
                        <div className="inline-flex items-center justify-center gap-2 max-w-full">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{rem.nome}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 text-center align-middle whitespace-nowrap">
                        {rem.documento || "—"}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 text-center align-middle truncate">
                        {rem.contato || "—"}
                      </td>
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            rem.ativo
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {rem.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirModalEditarRemetente(rem)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAlternarStatusRemetente(rem)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                              rem.ativo
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-700"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {rem.ativo ? (
                              <>
                                <Power className="w-3.5 h-3.5" />
                                <span>Inativar</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reativar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE NOTA (US27 / US28 / US33)                */}
      {/* ===================================================================== */}
      {modalNotaAberto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">
                {modoModalNota === "LOCAL"
                  ? "Emitir Nota Local de Recebimento"
                  : modoModalNota === "EDITAR"
                  ? "Editar Nota Pendente"
                  : "Registrar Nota de Recebimento"}
              </h2>
              <button type="button" onClick={() => setModalNotaAberto(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {modoModalNota === "LOCAL" && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
                O número sequencial da nota local (ex.: <strong>NL-2026-0001</strong>) será gerado automaticamente pelo sistema. Documento interno sem valor fiscal.
              </div>
            )}

            {erroModal && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {erroModal}
              </div>
            )}

            <form onSubmit={handleSalvarNota} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modoModalNota !== "LOCAL" && (
                  <div>
                    <label
                      htmlFor="input-numero-nota"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Número da Nota *
                    </label>
                    <input
                      id="input-numero-nota"
                      type="text"
                      maxLength={50}
                      disabled={modoModalNota === "EDITAR" && notaDetalhe?.tipo === "LOCAL"}
                      value={formNumeroNota}
                      onChange={(e) => setFormNumeroNota(e.target.value)}
                      placeholder="Ex: NF-000451"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="input-data-nota"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Data da Nota *
                  </label>
                  <input
                    id="input-data-nota"
                    type="date"
                    value={formDataNota}
                    onChange={(e) => setFormDataNota(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="select-remetente-nota"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Remetente *
                  </label>
                  <select
                    id="select-remetente-nota"
                    value={formRemetenteNotaId}
                    onChange={(e) => setFormRemetenteNotaId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  >
                    <option value="">Selecione um remetente...</option>
                    {remetentesAtivos.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nome}
                      </option>
                    ))}
                    {modoModalNota === "EDITAR" &&
                      notaDetalhe &&
                      !remetentesAtivos.some((r) => r.id === notaDetalhe.remetente.id) && (
                        <option value={notaDetalhe.remetente.id}>
                          {notaDetalhe.remetente.nome} (Inativo)
                        </option>
                      )}
                  </select>
                </div>

                {modoModalNota === "LOCAL" && (
                  <div>
                    <label
                      htmlFor="input-responsavel-entrega"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Responsável pela Entrega *
                    </label>
                    <input
                      id="input-responsavel-entrega"
                      type="text"
                      maxLength={150}
                      value={formResponsavelEntrega}
                      onChange={(e) => setFormResponsavelEntrega(e.target.value)}
                      placeholder="Ex: João Silva (Agroindústria)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Seletor de Entradas Disponíveis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Entradas de Estoque Vinculadas * ({formMovimentacaoIds.length} selecionada(s))
                </label>
                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {entradasDisponiveis.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Nenhuma entrada de estoque disponível sem nota vinculada.
                    </div>
                  ) : (
                    entradasDisponiveis.map((ent) => (
                      <label
                        key={ent.movimentacaoId}
                        className="flex items-center justify-between p-2.5 hover:bg-slate-50 text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={formMovimentacaoIds.includes(ent.movimentacaoId)}
                            onChange={() => alternarSelecaoEntrada(ent.movimentacaoId)}
                          />
                          <div>
                            <span className="font-bold text-slate-800">{ent.produtoNome}</span>
                            <span className="text-slate-500 ml-2">
                              ({ent.quantidade} {ent.unidadeMedida} • {ent.localNome})
                            </span>
                          </div>
                        </div>
                        <span className="text-slate-400">{ent.data}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-obs-nota"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Observações (Opcional)
                </label>
                <textarea
                  id="input-obs-nota"
                  rows={2}
                  maxLength={500}
                  value={formObservacoesNota}
                  onChange={(e) => setFormObservacoesNota(e.target.value)}
                  placeholder="Observações adicionais sobre o recebimento..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              {modoModalNota === "EXTERNA" && (
                <div>
                  <span className="block text-xs font-bold text-slate-700 mb-1.5">
                    Documento Digitalizado (Opcional)
                  </span>
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50/60 transition-colors overflow-hidden">
                    <label
                      htmlFor="input-arquivo-nota"
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-700 hover:bg-slate-50 shrink-0">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{formArquivoNota ? "Trocar arquivo" : "Selecionar arquivo"}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-700 truncate">
                          {formArquivoNota
                            ? formArquivoNota.name
                            : "PDF, JPEG ou PNG de até 5 MB"}
                        </p>
                        {formArquivoNota && (
                          <p className="text-[11px] text-slate-400">
                            {(formArquivoNota.size / 1024).toFixed(0)} KB
                          </p>
                        )}
                      </div>
                      <input
                        id="input-arquivo-nota"
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={(e) => setFormArquivoNota(e.target.files?.[0] || null)}
                        className="sr-only"
                      />
                    </label>
                    {formArquivoNota && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const url = URL.createObjectURL(formArquivoNota);
                            window.open(url, "_blank", "noopener,noreferrer");
                            setTimeout(() => URL.revokeObjectURL(url), 60000);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          title="Visualizar arquivo selecionado"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visualizar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormArquivoNota(null)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover arquivo selecionado"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNotaAberto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  {salvando ? "Salvando..." : "Salvar Nota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE DETALHE DA NOTA (US28 / US29 / US30 / US33)                  */}
      {/* ===================================================================== */}
      {notaDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto print:static print:bg-transparent print:p-0 print:overflow-visible">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              aside, header, nav, .no-print {
                display: none !important;
              }
              #comprovante-impressao-nota,
              #comprovante-impressao-nota * {
                visibility: visible !important;
              }
              #comprovante-impressao-nota {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 28px !important;
                border: 1px solid #334155 !important;
                border-radius: 8px !important;
                background: #ffffff !important;
                box-shadow: none !important;
              }
            }
          `}</style>
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:p-0 print:overflow-visible">
            <div className="no-print flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Nota {notaDetalhe.numero} ({notaDetalhe.tipo === "LOCAL" ? "Local" : "Externa"})
                </h2>
                <p className="text-xs text-slate-500">
                  Remetente: <strong>{notaDetalhe.remetente.nome}</strong> • Data: {notaDetalhe.data}
                </p>
              </div>
              <button type="button" onClick={() => setNotaDetalhe(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Metadados e Auditoria (oculto na impressão para não duplicar com o comprovante) */}
            <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase block">Status</span>
                <span className="font-black text-slate-900">{notaDetalhe.status}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase block">Registrado por</span>
                <span className="font-semibold text-slate-800">
                  {notaDetalhe.registradoPor?.nome}
                </span>
              </div>
              {notaDetalhe.responsavelEntrega && (
                <div>
                  <span className="text-slate-400 font-bold uppercase block">
                    Responsável pela Entrega
                  </span>
                  <span className="font-semibold text-slate-800">
                    {notaDetalhe.responsavelEntrega}
                  </span>
                </div>
              )}
              {notaDetalhe.decididoPor && (
                <div>
                  <span className="text-slate-400 font-bold uppercase block">
                    {notaDetalhe.status === "VALIDADA" ? "Validada por" : "Cancelada por"}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {notaDetalhe.decididoPor.nome}
                  </span>
                </div>
              )}
            </div>

            {notaDetalhe.justificativaCancelamento && (
              <div className="no-print p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <strong>Motivo do Cancelamento:</strong> {notaDetalhe.justificativaCancelamento}
              </div>
            )}

            {/* Entradas Vinculadas para Nota Externa */}
            {notaDetalhe.tipo !== "LOCAL" && !exibindoComprovanteImpressao && (
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">
                  Entradas de Estoque Vinculadas ({notaDetalhe.entradas.length})
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold">
                      <tr>
                        <th className="py-2 px-3">Produto</th>
                        <th className="py-2 px-3">Quantidade</th>
                        <th className="py-2 px-3">Local</th>
                        <th className="py-2 px-3">Lote / Validade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {notaDetalhe.entradas.map((ent) => (
                        <tr key={ent.movimentacaoId}>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {ent.produtoNome}
                          </td>
                          <td className="py-2 px-3">
                            {ent.quantidade} {ent.unidadeMedida}
                          </td>
                          <td className="py-2 px-3">{ent.localNome}</td>
                          <td className="py-2 px-3 text-slate-500">
                            {ent.lote || "—"} {ent.dataValidade ? `• Val: ${ent.dataValidade}` : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Comprovante Completo para Impressão e Assinatura (US33 / #420) */}
            {(notaDetalhe.tipo === "LOCAL" || exibindoComprovanteImpressao) && (
              <div
                id="comprovante-impressao-nota"
                data-testid="comprovante-nota-local"
                className="p-6 rounded-xl border-2 border-dashed border-slate-300 bg-white space-y-5 text-xs"
              >
                <div className="text-center border-b border-slate-200 pb-4">
                  <p className="font-black text-sm text-slate-900 uppercase tracking-wide">
                    IFPE CAMPUS BELO JARDIM — COZINHA / REFEITÓRIO
                  </p>
                  <p className="font-bold text-slate-700 mt-0.5">
                    COMPROVANTE INTERNO DE RECEBIMENTO — SEM VALOR FISCAL
                  </p>
                  <p className="text-slate-500 mt-1">
                    Nota Local Nº <strong>{notaDetalhe.numero}</strong> • Data:{" "}
                    <strong>{notaDetalhe.data}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                  <p>
                    <strong>Origem / Remetente:</strong> {notaDetalhe.remetente.nome}
                  </p>
                  <p>
                    <strong>Responsável pela Entrega:</strong>{" "}
                    {notaDetalhe.responsavelEntrega || "—"}
                  </p>
                  <p>
                    <strong>Registrado por:</strong> {notaDetalhe.registradoPor?.nome || "—"}
                  </p>
                  <p>
                    <strong>Status:</strong> {notaDetalhe.status}
                  </p>
                </div>

                {/* Tabela de Itens dentro do próprio comprovante */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                    Itens Recebidos ({notaDetalhe.entradas.length})
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Produto</th>
                          <th className="py-2 px-3">Quantidade</th>
                          <th className="py-2 px-3">Local</th>
                          <th className="py-2 px-3">Lote / Validade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {notaDetalhe.entradas.map((ent) => (
                          <tr key={ent.movimentacaoId}>
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {ent.produtoNome}
                            </td>
                            <td className="py-2 px-3">
                              {ent.quantidade} {ent.unidadeMedida}
                            </td>
                            <td className="py-2 px-3">{ent.localNome}</td>
                            <td className="py-2 px-3 text-slate-600">
                              {ent.lote || "—"}{" "}
                              {ent.dataValidade ? `• Val: ${ent.dataValidade}` : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {notaDetalhe.observacoes && (
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                    <strong>Observações:</strong> {notaDetalhe.observacoes}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8 pt-10 text-center">
                  <div className="border-t border-slate-500 pt-1.5">
                    Assinatura do Responsável pela Entrega (
                    {notaDetalhe.responsavelEntrega || "Entregador"})
                  </div>
                  <div className="border-t border-slate-500 pt-1.5">
                    Assinatura da Nutricionista Responsável ({notaDetalhe.registradoPor?.nome})
                  </div>
                </div>
              </div>
            )}

            {/* Anexo e Ações de Conferência (ocultos na impressão) */}
            <div className="no-print flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto">
                {notaDetalhe.possuiDocumento && (
                  <button
                    type="button"
                    onClick={() => handleBaixarDocumento(notaDetalhe)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex-1 sm:flex-1 lg:flex-initial"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>Baixar Documento</span>
                  </button>
                )}

                {notaDetalhe.status === "PENDENTE" && (
                  <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex-1 sm:flex-1 lg:flex-initial">
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {notaDetalhe.possuiDocumento
                        ? "Substituir PDF/Foto"
                        : notaDetalhe.tipo === "LOCAL"
                        ? "Anexar Cópia Assinada"
                        : "Anexar PDF/Foto"}
                    </span>
                    <input
                      type="file"
                      aria-label="Upload de documento no detalhe"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={handleUploadDocumentoDetalhe}
                      className="hidden"
                    />
                  </label>
                )}

                {notaDetalhe.tipo === "LOCAL" && (
                  <button
                    type="button"
                    onClick={() => {
                      setExibindoComprovanteImpressao(true);
                      if (typeof window !== "undefined" && window.print) {
                        window.print();
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex-1 sm:flex-1 lg:flex-initial"
                  >
                    <Printer className="w-3.5 h-3.5 shrink-0" />
                    <span>Imprimir para Assinatura</span>
                  </button>
                )}
              </div>

              {notaDetalhe.status === "PENDENTE" && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 w-full lg:w-auto lg:ml-auto">
                  <button
                    type="button"
                    onClick={() => abrirModalEditarNota(notaDetalhe)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex-1 lg:flex-initial"
                  >
                    <Edit2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Editar Nota</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErroModal(null);
                      setJustificativaCancelamento("");
                      setModalCancelarNotaAberto(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex-1 lg:flex-initial"
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Cancelar Nota</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleValidarNota(notaDetalhe.id)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex-1 lg:flex-initial"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Validar Nota</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE CANCELAMENTO DE NOTA COM JUSTIFICATIVA (US29 / #418)         */}
      {/* ===================================================================== */}
      {modalCancelarNotaAberto && notaDetalhe && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-black text-slate-900">
              Cancelar Nota {notaDetalhe.numero}
            </h3>
            <p className="text-xs text-slate-600">
              Informe a justificativa do cancelamento. As entradas de estoque vinculadas{" "}
              <strong>não são estornadas</strong> (o saldo de estoque permanece inalterado).
            </p>

            {erroModal && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">
                {erroModal}
              </div>
            )}

            <form onSubmit={handleConfirmarCancelamentoNota} className="space-y-4">
              <div>
                <label
                  htmlFor="input-justificativa-cancelamento"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Justificativa do Cancelamento *
                </label>
                <textarea
                  id="input-justificativa-cancelamento"
                  rows={3}
                  maxLength={500}
                  value={justificativaCancelamento}
                  onChange={(e) => setJustificativaCancelamento(e.target.value)}
                  placeholder="Descreva o motivo da recusa ou cancelamento..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalCancelarNotaAberto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE CADASTRO / EDIÇÃO DE REMETENTE (US26 / #415)                 */}
      {/* ===================================================================== */}
      {modalRemetenteAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">
                {remetenteEmEdicao ? "Editar Remetente" : "Cadastrar Remetente"}
              </h2>
              <button type="button" onClick={() => setModalRemetenteAberto(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {erroModal && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {erroModal}
              </div>
            )}

            <form onSubmit={handleSalvarRemetente} className="space-y-4">
              <div>
                <label
                  htmlFor="input-nome-remetente"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Nome do Remetente *
                </label>
                <input
                  id="input-nome-remetente"
                  type="text"
                  maxLength={150}
                  value={formNomeRemetente}
                  onChange={(e) => setFormNomeRemetente(e.target.value)}
                  placeholder="Ex: Setor de Agroindústria IFPE"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="input-doc-remetente"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  CPF ou CNPJ (Opcional)
                </label>
                <input
                  id="input-doc-remetente"
                  type="text"
                  maxLength={20}
                  value={formDocRemetente}
                  onChange={(e) => setFormDocRemetente(e.target.value)}
                  placeholder="11 dígitos (CPF) ou 14 dígitos (CNPJ)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="input-contato-remetente"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Contato (Opcional)
                </label>
                <input
                  id="input-contato-remetente"
                  type="text"
                  maxLength={150}
                  value={formContatoRemetente}
                  onChange={(e) => setFormContatoRemetente(e.target.value)}
                  placeholder="Telefone ou e-mail"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalRemetenteAberto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  {salvando ? "Salvando..." : "Salvar Remetente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
